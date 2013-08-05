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
      repo: data.repo,
      noClose: data.noClose
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
    else {
      $(document).trigger("doneSingleCommit");
    }
  });
}

var getFileTabSocketId = function(record) {
  return (Session.get("codeSessionId") + "_" + record.file.owner + "_" + record.file.repo + "_" + record.file.path).split('/').join('_');;
}

var Tab = function(record) {
  var id = record.file.path;
  var me = this;
  me.id = count++;
  me.record = record;
  me.newEditorWrapper = $("<div class='editor-wrapper'></div>");
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
  this.cm.refresh();
  this.isActive = true;
  for (var key in tabs) {
    if (tabs[key].isActive) {
      console.log(tabs[key].record.file.name);
      var syntax = getSyntaxByFileName(tabs[key].record.file.name);
      // set the code mirror syntax highlight
      tabs[key].changeSyntaxHighlight(syntax);
      // update the select
      var element = document.getElementById('syntaxHighlight');
      element.value = syntax;
    }
  }
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
  if (this.record.file.noClose) {
    this.hideTab();
  }
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
  console.log("change this syntax to:" + newSyntax);
  this.cm.setOption("mode", newSyntax);
}

Tab.prototype.changeTheme = function(newTheme) {
  this.cm.setOption("theme", newTheme);
}

Tab.prototype.hideTab = function() {
  this.tab.hide();
}

var getSyntaxByFileName = function(fileName) {
  var split = fileName.split('.');
  var fileExt = split[split.length - 1].toLowerCase();
  var syntax;
  switch(fileExt) {
    case "jade":
    case "js":      syntax = "javascript"; break;
    case "coffee":  syntax = "text/x-coffeescript"; break;
    case "py":      syntax = "text/x-python"; break;
    case "java":
    case "jspx":
    case "wss":
    case "do":
    case "action":
    case "jsp":     syntax = "text/x-java"; break;
    case "rb":
    case "rhtml":   syntax = "text/x-ruby"; break;
    case "erb":     syntax = "application/x-erb"; break;
    case "php":
    case "php4":
    case "php3":    syntax = "application/x-httpd-php"; break;
    case "phtml":
    case "html":
    case "htm":
    case "jhtml":   
    case "xhtml":   
    case "xml":     syntax = "text/html"; break;
    case "svg":
    case "rss":     syntax = "application/xml"; break;
    case "c":       syntax = "text/x-csrc"; break;
    case "cs":      syntax = "text/x-csrc"; break;
    case "pl":      syntax = "text/x-perl"; break;
    case "css":
    case "scss":
    case "less":
    case "sass":    syntax = "text/css"; break;
    case "groovy":  syntax = "text/x-groovy"; break;
    case "erl":     syntax = "text/x-erlang"; break;
    case "go":      syntax = "text/x-go"; break;
    case "lua":     syntax = "text/x-lua"; break;
    case "r":       syntax = "text/x-rsrc"; break;
    case "scala":   syntax = "text/x-scala"; break;
    case "sls":     syntax = "text/x-scheme"; break;
    case "hs":      syntax = "text/x-haskell"; break;
    case "clj":     syntax = "text/x-clojure"; break;
    default:        syntax = "javascript"; break;
  }
  return syntax;
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
  resize();
};

Template.codeMirror.rendered = function() {
  var fileTabs = FileTab.find({codeSessionId: Session.get("codeSessionId"), userId: Session.get("userId")});
  fileTabs.observeChanges({
    added: function(id, record) {
      if (record.isSocketReady == true) {
        addFileTab(record);
      }
    },
    changed: function(id, changed) {
      if (changed && changed.isSocketReady == true) {
        var record = FileTab.findOne({"_id": id});
        if (record.userId == Session.get("userId")) {
          addFileTab(record);
        }
      }
    }
  });

  var demoTab = FileTab.find({codeSessionId: Session.get("codeSessionId"), userId: Session.get("userId"), "file.noClose": true});
  demoTab.observe({
    removed: function(record) {
      if (tabs[record.file.path]) {
        var tab = tabs[record.file.path];
        tab.close();
        delete tabs[record.file.path];
      }
    }
  });

  var codeSession = CodeSession.find({"_id": Session.get("codeSessionId")});
  codeSession.observeChanges({
    added: function(id, record) {
      if (!record.githubRepo) {
        var defaultFileTabs = FileTab.find({codeSessionId: Session.get("codeSessionId"), userId: Session.get("userId")});
        if (defaultFileTabs.count() == 0) {
          insertNewTab({
            content: "<html>\n\t<body>\n\t\t<p>Welcome to Coco Dojo.</p>\n\t\t<p>Hope you enjoy it.</p>\n\t</body>\n</html>",
            name: "index.html",
            owner: Session.get("codeSessionId"),
            path: "index.html",
            repo: "",
            noClose: true
          });
        }
      }
      else {
        Meteor.call("removeTabs", Session.get("codeSessionId"), Session.get("userId"), function(error) {
        });
      }
    }
  });

  var changeLogs = ChangeLog.find({codeSessionId: Session.get("codeSessionId")});
  changeLogs.observeChanges({
    changed: function(newDoc, oldDoc) {
      if (oldDoc.isOld == true) {
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

$(document).on("preview", function(data) {
  $(document).trigger("commitToGit");
});

$(document).on("repoFileSelected", function(event, data) {
  data.change = "modify";
  insertNewTab(data);
});

$(document).on("doneAddFile", function(event, data) {
  data.change = "add";
  insertNewTab(data);
});


function resize() {
  $('#content').css('height', $('body').height() - 71 - $("#editorTab").height() +'px');
}

Meteor.startup(function () {
  $(document).ready(function() {
    resize();
    $(window).resize(function() {
      resize();
    });
  });
});
