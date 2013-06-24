var
EditorClient = ot.EditorClient,
SocketIOAdapter = ot.SocketIOAdapter,
CodeMirrorAdapter = ot.CodeMirrorAdapter;

var syntax = 'javascript';
var selectedTheme = 'ambiance';
var cmClient;
var userSessions = {};

var count = 0;

cocodojo.insertDocument = function(file) {
  var id = new Meteor.Collection.ObjectID();
  FileTab.insert({
    _id: id,
    fileTab: id,
    codeSessionId: Session.get("codeSessionId"),
    file: file
  });
};

var addFile = function(record) {
  var editorWrapper = $(".editorInstance")[count++];
  var cm = window.cm = CodeMirror(editorWrapper, {
    lineNumbers: true,
    lineWrapping: true,
    theme: selectedTheme,
    mode: syntax
  });
  var editorSocket = io.connect(document.location.hostname + "/filesync" + record.fileTab, {port: 3333});
  editorSocket.emit("join", {userSessionId: Session.get("userSession"), fileTabId: record.fileTab}).on("doc", function(obj){
    cm.setValue(obj.str);
    cmClient = window.cmClient = new EditorClient(
      obj.revision,
      obj.clients,
      new SocketIOAdapter(editorSocket),
      new CodeMirrorAdapter(cm)
    );
    cmClient.serverAdapter.socket.on('cursor', function(editorClientId, cursor){
      if(userSessions[editorClientId] !== undefined) return ;
      editorSocket
        .emit("getClientUserSessionId", {codeSessionId: Session.get("codeSessionId"), socketId: editorClientId})
        .on("returnClientUserSessionId", function(data){
          var user = SessionUsers.findOne({_id: data.clientUserSessionId});
          if(user){
            userSessions[data.editorClientId] = data.clientUserSessionId;
            cmClient.clients[data.editorClientId].setColor(user.userHue);
          }
        });
    });
  });
}


Template.codeMirror.rendered = function() {
  var fileTabs = FileTab.find({codeSessionId: Session.get("codeSessionId")});
  // var records = fileTabs.fetch();
  fileTabs.observeChanges({
    added: function (id, record) {
      console.log("fsdddddddd");
      addFile(record);
    },
    removed: function () {
    }
  });
//
//  cocodojo.insertDocument({
//    sha: Session.get("codeSessionId") + "2",
//    content: ""
//  });

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

$(document).on("repoFileSelected", function(event, data){
  cm.setValue(data.content);
});
