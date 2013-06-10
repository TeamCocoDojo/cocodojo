
CodeSession = new Meteor.Collection("codesession");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");

if(Meteor.isClient) {

  // Backbone Router Setup
  var Router = new (Backbone.Router.extend({
    routes:{ ":session_id": "sessionId" },
    sessionId: function (code_session_id) {
      console.log(code_session_id);
      Session.set("codeSessionId", code_session_id);
      CodeSession.update(
        {_id: code_session_id},
        { $push:
          { users:  Session.get('userId') }
        }
      );
    }
  }));

  Meteor.startup(function () {

    // Subscribe to the Collections according to codeSessionId
    Deps.autorun(function() {
      Meteor.subscribe("codesession", Session.get("codeSessionId"));
      Meteor.subscribe("chatbox", Session.get("codeSessionId"));
      Meteor.subscribe("whiteboard", Session.get("codeSessionId"));
    });

    // Check and create some user data in localstorage
    if(localStorage['userId'] == undefined){ localStorage['userId'] = Meteor.uuid(); }
    if(localStorage['username'] == undefined){ localStorage['username'] = "Anonymous-"+localStorage['userId'].slice(0, 4); }
    Session.set('userId', localStorage['userId']);
    Session.set('username', localStorage['username']);

    Backbone.history.start({pushState: true});
    $(document).ready(function() {
       if (window.location.pathname == "/") {
          // Create new dojo when no sessionId is specified
          //var codeSessionId = Meteor.call('start_new_session', [Session.get("userId")]);
          var codeSessionId = CodeSession.insert({
            "sessionName" : "New Dojo",
            "users" : [Session.get("userId")],
            "password" : "",
            "github_host" : ""
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


  });

  // Helper for using session variable in templates
  Handlebars.registerHelper('session',function(input){
    return Session.get(input);
  });

}
