
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
            sessionName : "New Dojo",
            users : [],
            password : "",
            github_host : ""
          });
          Session.set("codeSessionId", codeSessionId);

          // Set a new editor sync session
          var editorSocket = io.connect('ec2-184-169-238-194.us-west-1.compute.amazonaws.com', {port: 3333});
          editorSocket.on("doneCreate", function(){
            Router.navigate(codeSessionId, false);
          });
          editorSocket.emit("create", {codeSessionId: codeSessionId});
       }
    });

    // Check and create some user data in localstorage
    if(localStorage['userId'] == undefined){ localStorage['userId'] = Meteor.uuid(); }
    if(localStorage['username'] == undefined){ localStorage['username'] = "Anonymous-"+localStorage['userId'].slice(0, 4); }
    Session.set('userId', localStorage['userId']);
    Session.set('username', localStorage['username']);

  });

  // Helper for using session variable in templates
  Handlebars.registerHelper('session',function(input){
    return Session.get(input);
  });

}
