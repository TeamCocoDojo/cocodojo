CodeSession = new Meteor.Collection("codeSession");

if(Meteor.isServer){
   var serverOt = Npm.require('ot');
   var server = new serverOt.Server("lorem ipsum");
   var operation = new serverOt.TextOperation().retain(11).insert(" dolor");
   var str = operation.apply("lorem ipsum");

}
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

      // Fix me: typing simutaneously is not working very good. It should be something related to filter deltas. 
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
      // Fix me: Directly do "CodeSession.findOne" always return undefined. Maybe we should find a event to bind
      // Fix me: After several reloads, the CodeSession.findOne will always return undefined. Not yet figure out the cause. 
      editor.init = function(){
         var deltas = CodeSession.findOne({_id: Session.get("codeSessionId")});
         if( typeof deltas != "undefined"){
            //apply latest changes
            editor.update(deltas.Deltas);

            // add online users
/*
            CodeSession.update(
               {_id: Session.get("codeSessionId")},
               { $push:
                  { OnlineUsers: {name: editor.local_uid} }
               }
            );*/

         }
         else{
            console.log("unable to connect to the server, retry in 1 second");
            setTimeout("editor.init()", 1000);
         }

      };
      setTimeout("editor.init()", 1000);

      var mongoQuery = CodeSession.find({_id: Session.get("codeSessionId")});
      mongoQuery.observe({
         changed : function(newDoc, oldIndex, oldDoc) {
            console.log("observed");   
            editor.update(newDoc.Deltas);
            //editor.addComment(newDoc.Comments);
            console.log(newDoc.OnlineUsers);
         }
      });

      // Fix me: not working, should do server side validation
      // before leaves, update online user lists
      $(window).unload( function() {
         CodeSession.update(
            {_id: Session.get("codeSessionId")},
            { $pull:
               { OnlineUsers: {name: editor.local_uid} }

            }
         );
      });
      console.log(ot);
      var client = new ot.Client(0);
   };



}
