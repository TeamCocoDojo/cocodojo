
CodeSession = new Meteor.Collection("codesession");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");

var editorSocket = io.connect('ec2-184-169-238-194.us-west-1.compute.amazonaws.com', {port: 3333});

if(Meteor.isClient) {

  // Subscribe to the Collections according to codeSessionId
  Deps.autorun(function() {
    Meteor.subscribe("codesession", Session.get("codeSessionId"));
    Meteor.subscribe("chatbox", Session.get("codeSessionId"));
    Meteor.subscribe("whiteboard", Session.get("codeSessionId"));
  });

  // Backbone Router Setup
  var Router = new (Backbone.Router.extend({
    routes:{ ":session_id": "sessionId" },
    sessionId: function (code_session_id) {
       console.log(code_session_id);
       Session.set("codeSessionId", code_session_id);
    }
  }));

  Meteor.startup(function () {
    Backbone.history.start({pushState: true});
    $(document).ready(function() {
       if (window.location.pathname == "/") {
          // Create new dojo when no sessionId is specified
          var codeSessionId = CodeSession.insert({
            sessionName : "New Dojo",
            users : []
          });
          Session.set("codeSessionId", codeSessionId);
          editorSocket.on("doneCreate", function(){
            Router.navigate(codeSessionId, false);
          });
          editorSocket.emit("create", {codeSessionId: codeSessionId});
       }
    });
  });

}
