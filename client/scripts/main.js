var
  CodeSession = new Meteor.Collection("codesession"),
  Chatbox = new Meteor.Collection("chatbox"),
  Whiteboard = new Meteor.Collection("whiteboard");


if(Meteor.isClient) {

  // Subscribe to the Collections according to codeSessionId
  Meteor.autorun(function() {
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
      // Handler for when no sessionId is specified
       if (window.location.pathname == "/") {
          var codeSessionId = CodeSession.insert({
            name : "New Dojo",
            users : {}
          });
          Router.navigate(codeSessionId, false);
       }
    });
  });

}