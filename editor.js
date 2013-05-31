CodeSession = new Meteor.Collection("codeSession");
if(Meteor.isClient){
   var CocoDojoRouter = Backbone.Router.extend({
      routes:{
         ":session_id":"dojo"
      },
      dojo:function (codeSessionId) {
         console.log(codeSessionId);
         Session.set("codeSessionId", codeSessionId);
      },
      setCodeSession:function (codeSessionId) {
         this.navigate(codeSessionId, true);
      }
   });
   Router = new CocoDojoRouter;

   Meteor.startup(function () {
      Backbone.history.start({pushState: true});
      $(document).ready(function() {
         if (window.location.pathname == "/") {
            var codeSessionId = CodeSession.insert({name: "New Dojo"});
            Router.navigate(codeSessionId, false);
         }
      }); 
   });

   Template.editor.rendered = function(){
      var codeSession = CodeSession.find();
      var codeSessionId = Session.get("codeSessionId");

      /* create cocodojo object*/
      editor = {};
      editor.updateDue = false;
      editor.disableInput = false;
      editor.currentDelta = 0;
      editor.local_uid = (((1+Math.random())*0x10000)|0).toString(16).slice(1);
      editor.editorInstance = ace.edit("editorInstance");
      editor.editorInstance.setTheme("ace/theme/monokai");
      editor.editorInstance.getSession().setMode("ace/mode/javascript");
      editor.editorInstance.getSession().getDocument().on("change", function(e){
         if(editor.updateDue) return;
         console.log("changedd");
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
            if(deltas[i].sender_uid != editor.local_uid){
               pendDeltas.push(deltas[i].delta);
            }
         }
         if(pendDeltas.length > 0){
            editor.updateDue = true;
            editor.editorInstance.getSession().getDocument().applyDeltas(pendDeltas);
         }
         editor.currentDelta = deltas.length;
         editor.updateDue = false;
      };

      /*** Initialization ***/
      setTimeout(function(){
         var deltas = CodeSession.findOne({_id: Session.get("codeSessionId")}, {fields: {Deltas:1}}).Deltas;
         editor.update(deltas);
      }, 1000);

      var mongoQuery = CodeSession.find({_id: Session.get("codeSessionId")});
      mongoQuery.observe({
         changed : function(newDoc, oldIndex, oldDoc) {
            console.log("observed");
            editor.update(newDoc.Deltas);
            //editor.addComment(newDoc.Comments);
         }
      });
   };



}
