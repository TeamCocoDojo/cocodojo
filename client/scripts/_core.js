
CodeSession = new Meteor.Collection("codesession");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");

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
            name : "New Dojo",
            users : [],
            password : ""
          });
          Router.navigate(codeSessionId, false);
       }
    });
  });

}
