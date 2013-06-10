

var
  EditorClient = ot.EditorClient,
  SocketIOAdapter = ot.SocketIOAdapter,
  CodeMirrorAdapter = ot.CodeMirrorAdapter,
  editorSocket = io.connect('ec2-184-169-238-194.us-west-1.compute.amazonaws.com', {port: 3333});


Template.codeMirror.rendered = function() {
  var cmClient;
  var editorWrapper = document.getElementById('editorInstance');
  var cm = window.cm = CodeMirror(editorWrapper, {
    lineNumbers: true,
    lineWrapping: true,
    theme: 'blackboard',
    mode: 'javascript'
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

