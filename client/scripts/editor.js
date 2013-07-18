var
EditorClient = ot.EditorClient,
SocketIOAdapter = ot.SocketIOAdapter,
CodeMirrorAdapter = ot.CodeMirrorAdapter;
var syntax = 'javascript';
var selectedTheme = 'ambiance';
var cmClient;
var currentStatus = {}
var userSessions = {};
var repoData = {};
var tabs = {};
var sockets = {};
var count = 0;

var existTab = function(sha) {
  return tabs[sha];
}

var saveAllTabs = function() {
  var records = {};
  var contents = {};
  for (var key in tabs) {
    var tab = tabs[key];
    records[key] = tab.record;
    contents[key] = tab.cm.getValue();
  }
  Meteor.call('saveAllFileTabs', records, contents, function(error) {
    var fileTabs = FileTab.find({codeSessionId: Session.get("codeSessionId")});
    var documents = [];
    fileTabs.forEach(function(tab){
      var doc = {
        content: tab.file.content, 
        path: tab.file.path,
        sha: tab.file.sha,
        name: tab.file.name
      };
      if(doc.path){
        documents.push(doc);
      }
    });
    $(document).trigger({
      type: "ReceiveEditorContent",
      files: documents
    });

  });
}

var Tab = function(record) {
  var id = record.file.sha;
  var me = this;
  me.id = count++;
  me.record = record;
  me.newEditorWrapper = $("<div></div>");
  me.newEditorWrapper.attr("id", id);

  me.newEditorInstance = $("<div class='editorInstance'></div>");
  me.tab = $("<li class='file-tab'><a class='tab-link' href='#" + id + "'>" + record.file.name + "</a><span class='tab-close icon-remove'></span></li>");

  me.draw();
  me.tab.click(function() {
    me.active();
  });

  me.cm = CodeMirror(me.newEditorInstance[0], {
    lineNumbers: true,
    lineWrapping: true,
    theme: selectedTheme,
    mode: syntax
  });

  me.editorSocket = io.connect(document.location.hostname + "/filesync" + record.fileTab, {port: 3333});
  me.editorSocket.emit("join", {userSessionId: Session.get("userSession"), fileId: record.fileTab.toHexString()}).on("doc", function(obj){
    me.cm.setValue(obj.str);
    me.cmClient = new EditorClient(
      obj.revision,
      obj.clients,
      new SocketIOAdapter(me.editorSocket),
      new CodeMirrorAdapter(me.cm)
    );
    me.cmClient.serverAdapter.socket.on('cursor', function(editorClientId, cursor){
      if(userSessions[editorClientId] !== undefined) return ;
      me.editorSocket
      .emit("getClientUserSessionId", {codeSessionId: Session.get("codeSessionId"), socketId: editorClientId})
      .on("returnClientUserSessionId", function(data){
        var user = SessionUsers.findOne({_id: data.clientUserSessionId});
        if(user){
          userSessions[data.editorClientId] = data.clientUserSessionId;
          me.cmClient.clients[data.editorClientId].setColor(user.userHue);
        }
      });
    });
  });
  return this;
}

Tab.prototype.active = function() {
  for (var key in tabs) {
    tabs[key].inActive();
  }
  this.newEditorWrapper.show();
  this.tab.addClass("active");
  this.cm.refresh();
  this.isActive = true;
}

Tab.prototype.inActive = function() {
  this.tab.removeClass("active");
  this.newEditorWrapper.hide();
  this.isActive = false;
}

Tab.prototype.draw = function() {
  $("#editorTab").append(this.tab);
  $("#editorTabContent").append(this.newEditorWrapper);
  this.newEditorWrapper.append(this.newEditorInstance);
  this.isClosed = false;
  var me = this;
  this.tab.find(".tab-close").click(function (e) {
    e.stopPropagation();
    me.close();
  });
}

Tab.prototype.close = function() {
  var me = this;
  Meteor.call('closeFileTab', this.record, this.cm.getValue(), function(error) {
    if (error) {
      console.log(error);
    }
    else {
      me.newEditorWrapper.remove();
      me.tab.remove();
      me.isClosed = true;
    }
    if (me.isActive && me.isActive == true) {
      for (var key in tabs) {
        tabs[key].active();
        break;
      }
    }
  });
}

Tab.prototype.rename = function(name) {

}

cocodojo.insertFileTab = function(file) {
  var record = FileTab.findOne({codeSessionId: Session.get("codeSessionId"), "file.sha": file.sha});
  if (!record) {
    var id = new Meteor.Collection.ObjectID();
    FileTab.insert({
      _id: id,
      fileTab: id,
      codeSessionId: Session.get("codeSessionId"),
      isOpen: true,
      file: file,
      userId: Session.get('userSession')
    });
  }
  else {
    addFileTab(record);
  }
};

var addFileTab = function(record) {
  if (tabs[record.file.sha]) {
    var tab = tabs[record.file.sha];
    tab.draw();
  }
  else {
    var tab = new Tab(record);
    tabs[record.file.sha] = tab;
    tab.active();
  }
};

Template.codeMirror.rendered = function() {
  var fileTabs = FileTab.find({codeSessionId: Session.get("codeSessionId")});
  fileTabs.observeChanges({
    
    changed: function(id, changed) {
      console.log("changed");
      if (changed && changed.isSocketReady == true) {
        var record = FileTab.findOne({"_id": id});        
        if (record.userId == Session.get("userSession")) {
          addFileTab(record);
        }
      }
    },
    removed: function () {
    }
  });
}

Template.codeMirror.events = {
  'change #syntaxHighlight': function(e) {
    syntax = e.target.value;
    cm.setOption("mode", syntax);
  },
  'change #themeHighlight': function(e) {
    selectedTheme = e.target.value;
    cm.setOption("theme", selectedTheme);
  }
}

$(document).on("commitToGit", function(data){
  saveAllTabs();
});

$(document).on("repoFileSelected", function(event, data){
  if (!existTab(data.sha)) {
    cocodojo.insertFileTab({
      content: data.content,
      sha: data.sha,
      name: data.name,
      path: data.path
    });
  }
  else {
    var tab = tabs[data.sha];
    if (tab.isClosed) {
      tab.draw();
    }
    tabs[data.sha].active();
  }
});
