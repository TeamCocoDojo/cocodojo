CodeSession = new Meteor.Collection("codesession"),
Chatbox = new Meteor.Collection("chatbox"),
Whiteboard = new Meteor.Collection("whiteboard");

if(Meteor.isServer) {
  Meteor.publish("codesession", function(code_session_id) {
    return CodeSession.find({}, {codeSessionId: code_session_id});
  });
  Meteor.publish("chatbox", function(code_session_id) {
    return Chatbox.find({}, {codeSessionId: code_session_id});
  });
  Meteor.publish("whiteboard", function(code_session_id) {
    return Whiteboard.find({}, {codeSessionId: code_session_id});
  });
}