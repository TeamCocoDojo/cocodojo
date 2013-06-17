var
EditorClient = ot.EditorClient,
SocketIOAdapter = ot.SocketIOAdapter,
CodeMirrorAdapter = ot.CodeMirrorAdapter;
editorSocket = io.connect('ec2-184-169-238-194.us-west-1.compute.amazonaws.com', {port: 3333});
var syntax = 'text/x-python';
var selectedTheme = 'blackboard';
var cm;

$(document).on("repoFileSelected", function(event, data){
  console.log("triggerd");
  console.log(data);
  cm.getDoc().setValue(data.content);
});

Template.codeMirror.rendered = function() {
  var cmClient;
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
