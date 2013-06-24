var
EditorClient = ot.EditorClient,
SocketIOAdapter = ot.SocketIOAdapter,
CodeMirrorAdapter = ot.CodeMirrorAdapter;

var syntax = 'javascript';
var selectedTheme = 'ambiance';
var cmClient;
var userSessions = {};
Template.codeMirror.rendered = function() {
  var editorWrapper = document.getElementById('editorInstance');
  var cm = window.cm = CodeMirror(editorWrapper, {
    lineNumbers: true,
    lineWrapping: true,
    theme: selectedTheme,
    mode: syntax
  });
  var editorSocket = io.connect(document.location.hostname + "/channel1", {port: 3333});
  editorSocket.emit("join", {userSessionId: Session.get("userSession"), codeSessionId: Session.get("codeSessionId")}).on("doc", function(obj){
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
