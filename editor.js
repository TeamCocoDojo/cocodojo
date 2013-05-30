CodeSession = new Meteor.Collection("codeSession");
if(Meteor.isClient){
   Template.editor.rendered = function(){
      var codeSession = CodeSession.find();
      /* Initial new session */
      var codeSessionId = CodeSession.insert({name: "New Dojo"});
      Session.set("codeSessionId", codeSessionId);
      
      /* create cocodojo object*/
      editor = {};
      editor.updateDue = false;
      editor.disableInput = false;
      editor.currentDelta = 0;
      editor.localComments = {};
      editor.commentsCount = 0;
      editor.local_uid = (((1+Math.random())*0x10000)|0).toString(16).slice(1);
      editor.editorInstance = ace.edit("editorInstance");
      editor.editorInstance.setTheme("ace/theme/monokai");
      editor.editorInstance.getSession().setMode("ace/mode/javascript");
      editor.editorInstance.getSession().getDocument().on("change", function(e){
         CodeSession.update(
            {_id: Session.get("codeSessionId")}, 
            { $push:
               {
               Deltas: { delta: e.data , sender_uid: editor.local_uid}
            }
            }
         );
      });
      editor.update = function(deltas){
         if(deltas === undefined){ return false; }
         var pendDeltas = [];
         for(var i=editor.currentDelta; i<deltas.length; ++i){
            if(deltas[i].sender_uid !== editor.local_uid){
               pendDeltas.push(deltas[i].delta);
            }
         }
         console.log(pendDeltas.length);
         if(pendDeltas.length > 0){
            editor.updateDue = true;
            editor.editorInstance.getSession().getDocument().applyDeltas(pendDeltas);
         }
         editor.currentDelta = deltas.length;
         editor.updateDue = false;
      };



      var mongoQuery = CodeSession.find({_id: Session.get("codeSessionId")});
      mongoQuery.observe({
         changed : function(newDoc, oldIndex, oldDoc) {
            console.log(newDoc);
            editor.update(newDoc.Deltas);
            //editor.addComment(newDoc.Comments);
         }
      });
   };



}
