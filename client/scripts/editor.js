

var
  EditorClient = ot.EditorClient,
  SocketIOAdapter = ot.SocketIOAdapter,
  CodeMirrorAdapter = ot.CodeMirrorAdapter;
  var syntax = 'text/x-python';
  var selectedTheme = 'blackboard';
  var cm;

  Template.codeMirror.rendered = function() {
    var cmClient;
    var editorWrapper = document.getElementById('editorInstance');
    cm = window.cm = CodeMirror(editorWrapper, {
      lineNumbers: true,
      lineWrapping: true,
      theme: selectedTheme,
      mode: syntax
    });

    cocodojo.editorSocket.on("cursor", function() {
      console.log("Fsdfdsfdsfs");
      console.log(cmClient.clients);
    });

    cocodojo.editorSocket.on("operation", function() {
      console.log(cmClient.clients);
    });

    cocodojo.editorSocket.emit("join", {codeSessionId: Session.get("codeSessionId")}).on("doc", function(obj){
      cm.setValue(obj.str);
      cmClient = window.cmClient = new EditorClient(
        obj.revision,
        obj.clients,
        new SocketIOAdapter(cocodojo.editorSocket),
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