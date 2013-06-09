CodeSession = new Meteor.Collection("codesession");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");

if(Meteor.isServer) {
  Meteor.publish("codesession", function(code_session_id) {
    check(code_session_id, String);
    return CodeSession.find({_id: code_session_id});
  });
  Meteor.publish("chatbox", function(code_session_id) {
    check(code_session_id, String);
    return Chatbox.find({codeSessionId: code_session_id});
  });
  Meteor.publish("whiteboard", function(code_session_id) {
    check(code_session_id, String);
    return Whiteboard.find({codeSessionId: code_session_id});
  });
}

// Meteor.methods({
//   start_new_session: function (users) {
//     var codeSessionId = CodeSession.insert({
//       "sessionName" : "New Dojo",
//       "users" : users,
//       "password" : "",
//       "github_host" : ""
//     });
//     return codeSessionId;
//   }
// });
