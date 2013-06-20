var
EditorClient = ot.EditorClient,
SocketIOAdapter = ot.SocketIOAdapter,
CodeMirrorAdapter = ot.CodeMirrorAdapter;
editorSocket = io.connect('localhost', {port: 3333});
var syntax = 'javascript';
var selectedTheme = 'ambiance';
var cm;
var cmClient;


Template.codeMirror.rendered = function() {
  var editorWrapper = document.getElementById('editorInstance');
  cm = window.cm = CodeMirror(editorWrapper, {
    lineNumbers: true,
    lineWrapping: true,
    theme: selectedTheme,
    mode: syntax
  });
  editorSocket.emit("join", {codeSessionId: Session.get("codeSessionId")}).on("doc", function(obj){
    cm.setValue(obj.str);
    cmClient = window.cmClient = new EditorClient(
      obj.revision,
      obj.clients,
      new SocketIOAdapter(editorSocket),
      new CodeMirrorAdapter(cm)
    );
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
