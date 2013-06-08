
var cocodojo = cocodojo || {}; 
var EditorClient = ot.EditorClient;
var SocketIOAdapter = ot.SocketIOAdapter;
var CodeMirrorAdapter = ot.CodeMirrorAdapter;
//CodeSession = new Meteor.Collection("codeSession");
var socket = io.connect('ec2-184-169-238-194.us-west-1.compute.amazonaws.com', {port: 3333});

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
  var me = this;
  $(document).ready(function() {
    if (window.location.pathname == "/") {
      var codeSessionId = me.cocodojo.CodeSession.insert({_id: new Meteor.Collection.ObjectID(), "name": "new dojo"});
      //Fix me: When first time create the code session. It would not set the code session id to the session.
      Session.set("codeSessionId", codeSessionId);
      socket.on("doneCreate", function(){
        Router.navigate(codeSessionId.toHexString(), false);
      });
      socket.emit("create", {codeSessionId: codeSessionId.toHexString()});
    }
  }); 
});

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
    cm.setValue(obj.str);
    cmClient = window.cmClient = new EditorClient(
      obj.revision,
      obj.clients,
      new SocketIOAdapter(socket),
      new CodeMirrorAdapter(cm)
    );
  });
}

