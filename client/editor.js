Template.editor.rendered = function(){
   var editor = ace.edit("editorInstance");
   editor.setTheme("ace/theme/monokai");
   editor.getSession().setMode("ace/mode/javascript");
   var mongoQuery = CodeSession.find({_id: Session.get("codeSessionId")});
   mongoQuery.observe({
      changed : function(newDoc, oldIndex, oldDoc) {
         cocodojo.editor.update(newDoc.Deltas);
         cocodojo.editor.addComment(newDoc.Comments);
      }
   });
};


