CodeSession = new Meteor.Collection("codeSession");


if(Meteor.isServer){
  var server = new ot.Server("");
  server.broadcast = function(operation) {
  };

  function onReceiveOperation (json) {
    var operation = ot.Operation.fromJSON(JSON.parse(json));
  }

}
if(Meteor.isClient){

  var cocodojo = cocodojo || {};


  var CocoDojoRouter = Backbone.Router.extend({
    routes: {
      ":session_id": "dojo",
      ":session_id/sync": "sync"
    },
    dojo: function(codeSessionId) {
      Session.set("codeSessionId", codeSessionId);
      cocodojo.client = new ot.Client(0);

      cocodojo.client.applyOperation = function (operation) {

      };

      cocodojo.client.sendOperation = function (operation) {
        // send the operation to the server, e.g. with ajax:
        console.log(operation);
        $.ajax({
          url: codeSessionId + '/sync',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(operation)
        });
      };

      function onUserChange (change) {
        var operation = client.createOperation(); // has the right revision number
        // initialize operation here with for example operation.fromCodeMirrorChange
        client.applyClient(operation);
      }

      function onReceiveOperation (json) {
        var operation = ot.Operation.fromJSON(JSON.parse(json));
        client.applyServer(operation);
      }

    },
    sync :function(codeSessionId) {

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

    cocodojo.client.sendOperation(e.data);
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
