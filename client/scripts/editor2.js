
var cocodojo = cocodojo || {};
var backend = new function(){
  //this.url = "http://cocodojo-backend.herokuapp.com/";
  this.url = "http://10.0.22.69:3333/";
  $.ajaxSetup({
    headers: {"X-Requested-With":"Ajax"}
  });
  this.createSession = function(codeSessionId){
    console.log("here");
    $.ajax({
      url: this.url + codeSessionId + "/create",
      type: "POST",
      success: function(data){
        console.log(data);
      },
      error: function(){
        console.log("error");
      }
    });
  };
  this.syncToServer = function(codeSessionId, editor ,operation){
    var data = {"revision": editor.client.revision, "operation": JSON.stringify(operation)};
    console.log(data);
    $.ajax({
      url: this.url + codeSessionId + "/sync",
      type: "POST",
      data: data,
      success: function(data){
        console.log("success");
        console.log(data);
      },
      error: function(data){
        console.log("error");
        console.log(data);
      }
    });
  
  };
};
console.log(backend);
CodeSession = new Meteor.Collection("codeSession");
Meteor.startup(function () {
  Backbone.history.start({pushState: true});
  $(document).ready(function() {
    if (window.location.pathname == "/") {
      var codeSessionId = CodeSession.insert({_id: new Meteor.Collection.ObjectID(), "name": "new dojo"});
      console.log(codeSessionId );
      backend.createSession(codeSessionId);
      Router.navigate(codeSessionId.toHexString(), false);
    }
  }); 
});

//CodeSession = new Meteor.Collection("codeSession");
Template.codeMirror.rendered = function(){
  /* create cocodojo object*/
  editor = {};
  editor.updateDue = false;
  editor.disableInput = false;
  editor.currentDelta = 0;
  editor.local_uid = (((1+Math.random())*0x10000)|0).toString(16).slice(1);
  editor.client = new ot.Client(0);
  editor.editorInstance = CodeMirror.fromTextArea(document.getElementById("editorInstance"), {
    mode: 'javascript', 
    theme: 'blackboard',
    lineNumbers: true 
  });
  editor.cmAdapter = new ot.CodeMirrorAdapter(editor.editorInstance);

  editor.cmAdapter.registerCallbacks({
    change: function (operation, inverse) {
      console.log("changed, send operation to server");
      var item = CodeSession.findOne({_id: Session.get("codeSessionId")});
      console.log("operation= "+ JSON.stringify(operation));
      //CodeSession.update({_id: item._id}, {name: "test"});
      editor.client.sendOperation(operation, inverse);
    }
  });

  editor.client.sendOperation = function (operation, inverse){
    backend.syncToServer(Session.get("codeSessionId"), editor, operation);
  };

  editor.client.applyOperation = function (operation) {
    editor.cmAdapter.applyOperation(operation);
    editor.cmAdapter.ignoreNextChange = false;
  };

  var mongoQuery = CodeSession.find({_id: Session.get("codeSessionId")});
  mongoQuery.observe({
    added: function(id, field){
      console.log("added");
    },

    changed : function(newDoc, oldDoc, atIndex) {
      console.log("observed Change:");
      console.log(newDoc);
      console.log(oldDoc);
      console.log(atIndex);

      var operations = new ot.TextOperation(newDoc.operations.slice(atIndex, newDoc.length));
      editor.client.applyServer(operations);
    }
  });

}

