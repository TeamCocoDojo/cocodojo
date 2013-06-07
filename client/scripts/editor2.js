
var cocodojo = cocodojo || {}; 
var EditorClient = ot.EditorClient;
var SocketIOAdapter = ot.SocketIOAdapter;
var CodeMirrorAdapter = ot.CodeMirrorAdapter;
CodeSession = new Meteor.Collection("codeSession");
var socket = io.connect('10.0.22.69', {port: 3333});


Meteor.startup(function () {
  Backbone.history.start({pushState: true});
  $(document).ready(function() {
    if (window.location.pathname == "/") {
      var codeSessionId = CodeSession.insert({_id: new Meteor.Collection.ObjectID(), "name": "new dojo"});
      console.log(codeSessionId );
      socket.on("doneCreate", function(){
        Router.navigate(codeSessionId.toHexString(), false);
      });
      socket.emit("create", {codeSessionId: codeSessionId.toHexString()});
    }
  }); 
});

//CodeSession = new Meteor.Collection("codeSession");
Template.codeMirror.rendered = function(){
  var cmClient;
  var editorWrapper = document.getElementById('editorInstance');
  var cm = window.cm = CodeMirror(editorWrapper, {
    lineNumbers: true,
    lineWrapping: true,
    theme: 'blackboard',
    mode: 'javascript' 
  });

  socket.emit("join", {codeSessionId: Session.get("codeSessionId")}).on("doc", function(obj){
    console.log("receive 'doc' event from server:");
    console.log(obj);
    cm.setValue(obj.str);
    cmClient = window.cmClient = new EditorClient(
      obj.revision,
      obj.clients,
      new SocketIOAdapter(socket),
      new CodeMirrorAdapter(cm)
    );
  });
  /* create cocodojo object*/
  //console.log(backend);
  editor = {};
  editor.updateDue = false;
  editor.disableInput = false;
  editor.currentDelta = 0;
  editor.local_uid = (((1+Math.random())*0x10000)|0).toString(16).slice(1);


  /*editor.client.sendOperation = function (operation, inverse){
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
  }); */

}

