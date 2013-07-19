
CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");
WhiteboardCursor = new Meteor.Collection("whiteboard_cursor");
FileTab = new Meteor.Collection("filetab");

if (Meteor.isClient) {
  cocodojo.editorSocket = io.connect(document.location.hostname + '/editor', {port: 3333});
  cocodojo.videoSocket = io.connect(document.location.hostname + '/video', {port: 3333});
  cocodojo.getGithubObj = function(){
  	if(cocodojo.githubUser === undefined) return new GithubLib({});
  	if(cocodojo.githubObj === undefined ){
  		cocodojo.githubObj = new GithubLib({
  			token: cocodojo.githubUser.accessToken,
  			auth: "oauth"
  		});
		}
  	return cocodojo.githubObj;
	};

  Meteor.startup(function () {

    // Subscribe to the Collections according to codeSessionId
    Deps.autorun(function() {
      Meteor.subscribe("codesession", Session.get("codeSessionId"));
      Meteor.subscribe("sessionusers", Session.get("codeSessionId"), Session.get('userId'), Session.get('username'), Session.get('userSession'));
      Meteor.subscribe("chatbox", Session.get("codeSessionId"));
      Meteor.subscribe("whiteboard", Session.get("codeSessionId"));
      Meteor.subscribe("whiteboard_cursor", Session.get("codeSessionId"));
      Meteor.subscribe("filetab", Session.get("codeSessionId"));
    });

    // (c) 2012-2013 Tim Baumann <tim@timbaumann.info> (http://timbaumann.info)
    // Extracted from ot.js - function for generating random user color
    function generateColor(hue){
      function rgb2hex (r, g, b) {
        function digits (n) {
          var m = Math.round(255*n).toString(16);
          return m.length === 1 ? '0'+m : m;
        }
        return '#' + digits(r) + digits(g) + digits(b);
      }

      function hsl2hex (h, s, l) {
        if (s === 0) { return rgb2hex(l, l, l); }
        var var2 = l < 0.5 ? l * (1+s) : (l+s) - (s*l);
        var var1 = 2 * l - var2;
        var hue2rgb = function (hue) {
          if (hue < 0) { hue += 1; }
          if (hue > 1) { hue -= 1; }
          if (6*hue < 1) { return var1 + (var2-var1)*6*hue; }
          if (2*hue < 1) { return var2; }
          if (3*hue < 2) { return var1 + (var2-var1)*6*(2/3 - hue); }
          return var1;
        };
        return rgb2hex(hue2rgb(h+1/3), hue2rgb(h), hue2rgb(h-1/3));
      }

      return hsl2hex(hue, 0.75, 0.5);
    }

    // Function for creating new user session
    var userHue = Math.random();
    function createUserSession(){
      return SessionUsers.insert({
        "codeSessionId": Session.get('codeSessionId'),
        "userId": Session.get('userId'),
        "username": Session.get('username'),
        "userColor": generateColor(userHue),
        "userHue": userHue
      });
    }

    // Backbone Router Setup
    var Router = new (Backbone.Router.extend({
      routes:{ ":session_id": "sessionId" },
      sessionId: function (code_session_id) {
        Session.set("codeSessionId", code_session_id);
        // Insert the user into the session userlist if he is not the creater
        if(Session.get('userSession') == undefined){
          Session.set('userSession', createUserSession());
        }
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
        });

        var id = new Meteor.Collection.ObjectID();
        
        FileTab.insert({
          _id: id,
          fileTab: id,
          codeSessionId: codeSessionId,
          isOpen: true,
          file: {
            content: "Welcome to Coco Dojo, 5 Bucks",
            sha: codeSessionId + "-untitled",
            name: "untitled"
          }
        });

        Session.set("codeSessionId", codeSessionId);
        // Insert the user into the session userlist
        Session.set('userSession', createUserSession());

        // Set a new editor sync session
        Router.navigate(codeSessionId, false);
      }
    });
  });

  // Helper for using session variable in templates
  Handlebars.registerHelper('session', function(input){
    return Session.get(input);
  });

}
