
var cocodojo = cocodojo || {};
Template.codeMirror.rendered = function(){
  /* create cocodojo object*/
  editor = {};
  editor.updateDue = false;
  editor.disableInput = false;
  editor.currentDelta = 0;
  editor.local_uid = (((1+Math.random())*0x10000)|0).toString(16).slice(1);
  editor.editorInstance = CodeMirror.fromTextArea(document.getElementById("editorInstance"), {
    mode: 'javascript', 
    theme: 'blackboard',
    lineNumbers: true
  });
  editor.cmAdapter = new ot.CodeMirrorAdapter(editor.editorInstance);
  
  editor.cmAdapter.registerCallbacks({
    change: function (operation, inverse) {
      console.log(operation);
      console.log(inverse);
    }
  });
}

