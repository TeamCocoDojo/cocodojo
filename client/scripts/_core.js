
CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");

if(Meteor.isClient) {
  cocodojo.editorSocket = io.connect('localhost', {port: 3333});
          
  Meteor.startup(function () {

    // Subscribe to the Collections according to codeSessionId
    Deps.autorun(function() {
      console.log(Session.get('userId') );
      console.log(Session.get('username') );
      Meteor.subscribe("codesession", Session.get("codeSessionId"));
      Meteor.subscribe("sessionusers", Session.get("codeSessionId"), Session.get('userId'), Session.get('username'), Session.get('userSession'));
      Meteor.subscribe("chatbox", Session.get("codeSessionId"));
      Meteor.subscribe("whiteboard", Session.get("codeSessionId"));
    });

    // Backbone Router Setup
    var Router = new (Backbone.Router.extend({
      routes:{ ":session_id": "sessionId" },
      sessionId: function (code_session_id) {
        console.log(code_session_id);
        Session.set("codeSessionId", code_session_id);
        // Insert the user into the session userlist
        var userSession = SessionUsers.insert({
          "codeSessionId": Session.get('codeSessionId'),
          "userId": Session.get('userId'),
          "username": Session.get('username')
        });
        Session.set('userSession', userSession);
       }
    }));

    // Check and create some user data in localstorage
    if(localStorage['userId'] == undefined){ localStorage['userId'] = Meteor.uuid(); }
    if(localStorage['username'] == undefined){ localStorage['username'] = "Anonymous-"+localStorage['userId'].slice(0, 4); }
    Session.set('userId', localStorage['userId']);
    Session.set('username', localStorage['username']);

    Backbone.history.start({pushState: true});
    $(document).ready(function() {
       if (window.location.pathname == "/") {
          // Create new dojo when no sessionId is specified
          var codeSessionId = CodeSession.insert({
            "sessionName" : "New Dojo",
            //"users" : [ { userId: Session.get("userId"), username: Session.get("username") } ],
            "password" : "",
            "github_host" : ""
          });
          Session.set("codeSessionId", codeSessionId);
          // Insert the user into the session userlist
          var userSession = SessionUsers.insert({
            "codeSessionId": Session.get('codeSessionId'),
            "userId": Session.get('userId'),
            "username": Session.get('username')
          });
          Session.set('userSession', userSession);

          // Set a new editor sync session
          cocodojo.editorSocket.on("doneCreate", function(){
            Router.navigate(codeSessionId, false);
          });
          cocodojo.editorSocket.emit("create", {codeSessionId: codeSessionId});
       }
    });


  });

  // Helper for using session variable in templates
  Handlebars.registerHelper('session',function(input){
    return Session.get(input);
  });

}
