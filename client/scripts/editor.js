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

var existTab = function(path) {
  return tabs[path];
}

var insertNewTab = function(data) {
  if (!existTab(data.path)) {
    insertFileTab({
      content: data.content,
      path: data.path,
      change: data.change,
      name: data.name,
      path: data.path,
      owner: data.owner,
      repo: data.repo
    });
  }
  else {
    var tab = tabs[data.path];
    if (tab.isClosed) {
      tab.draw();
    }
    tabs[data.path].active();
  }
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
    if (error) {
      console.log(error);
    }
  });
}

var getFileTabSocketId = function(record) {
  return (record.file.owner + "_" + record.file.repo + "_" + record.file.path).split('/').join('_');;
}

var Tab = function(record) {
  var id = record.file.path;
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

  var socketId = getFileTabSocketId(record);

  me.editorSocket = io.connect(document.location.hostname + "/filesync" + socketId, {port: 3333});
  me.editorSocket.emit("join", {userSessionId: Session.get("userId"), fileId: socketId}).on("doc", function(obj){
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
  // console.log("triggered: " + this.cm.getOption("mode"));
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

Tab.prototype.changeSyntaxHighlight = function(newSyntax) {
  this.cm.setOption("mode", newSyntax);
}

Tab.prototype.changeTheme = function(newTheme) {
  this.cm.setOption("theme", newTheme);
}

var insertFileTab = function(file) {
  var record = FileTab.findOne({codeSessionId: Session.get("codeSessionId"), "file.path": file.path, userId: Session.get('userId')});
  if (!record) {
    var id = new Meteor.Collection.ObjectID();
    FileTab.insert({
      _id: id,
      fileTab: id,
      codeSessionId: Session.get("codeSessionId"),
      isOpen: true,
      file: file,
      userId: Session.get('userId')
    });
  }
  else {
    addFileTab(record);
  }
};

var addFileTab = function(record) {
  if (tabs[record.file.path]) {
    var tab = tabs[record.file.path];
    tab.draw();
  }
  else {
    var tab = new Tab(record);
    tabs[record.file.path] = tab;
    tab.active();
  }
};

Template.codeMirror.rendered = function() {
  var fileTabs = FileTab.find({codeSessionId: Session.get("codeSessionId")});
  fileTabs.observeChanges({
    changed: function(id, changed) {
      if (changed && changed.isSocketReady == true) {
        var record = FileTab.findOne({"_id": id});        
        if (record.userId == Session.get("userId")) {
          addFileTab(record);
        }
      }
    }
  });

  var changeLogs = ChangeLog.find({codeSessionId: Session.get("codeSessionId")});
  changeLogs.observeChanges({
    changed: function(id, changed) {
      if (changed.isOld == true) {
        saveAllTabs();
      }
    }
  });
}

Template.codeMirror.events = {
  'change #syntaxHighlight': function(e) {
    syntax = e.target.value;
    for (var key in tabs) {
      if (tabs[key].isActive) {
        tabs[key].changeSyntaxHighlight(syntax);
      }
    }
  },
  'change #themeHighlight': function(e) {
    selectedTheme = e.target.value;
    for (var key in tabs) {
      tabs[key].changeTheme(selectedTheme);
    }
  }
}

$(document).on("commitToGit", function(data) {
  ChangeLog.insert({
    codeSessionId: Session.get("codeSessionId"),
  });
});

$(document).on("preview", function(data) {
  ChangeLog.insert({
    codeSessionId: Session.get("codeSessionId"),
  });
});

$(document).on("repoFileSelected", function(event, data) {
  data.change = "modify";
  console.log(data);
  insertNewTab(data);
});

$(document).on("doneAddFile", function(event, data) {
  data.change = "add";
  console.log(data);
  insertNewTab(data);
});
