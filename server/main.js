CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");
WhiteboardCursor = new Meteor.Collection("whiteboard_cursor");
FileTab = new Meteor.Collection("filetab");

if(Meteor.isServer) {
  Meteor.publish("codesession", function(code_session_id) {
    check(code_session_id, String);
    return CodeSession.find({_id: code_session_id});
  });
  Meteor.publish("sessionusers", function(code_session_id, user_id, user_name, user_session) {
    check(code_session_id, String);
    check(user_id, String);
    check(user_name, String);
    // Remove user from userlist when disconnected
    if(this._session.socket._events.data.length === 1) {
      this._session.socket.on("close", Meteor.bindEnvironment(function() {
        SessionUsers.remove(user_session);
      }, function(e) { console.log("close error", e); }));
    }
    return SessionUsers.find({codeSessionId: code_session_id});
  });
  Meteor.publish("chatbox", function(code_session_id) {
    check(code_session_id, String);
    return Chatbox.find({codeSessionId: code_session_id});
  });
  Meteor.publish("whiteboard", function(code_session_id) {
    check(code_session_id, String);
    return Whiteboard.find({codeSessionId: code_session_id});
  });
  Meteor.publish("whiteboard_cursor", function(code_session_id) {
    check(code_session_id, String);
    return WhiteboardCursor.find({codeSessionId: code_session_id});
  });
  Meteor.publish("filetab", function(code_session_id) {
    check(code_session_id, String);
    return FileTab.find({codeSessionId: code_session_id});
  });

  var io = socketIO.listen(3333);

  var syncServers = {};
  var fileTabs = FileTab.find({});
  fileTabs.forEach(function(fileTab) {
    console.log('/filesync' + fileTab._id);
    io.of('/filesync' + fileTab._id).on('connection', function(socket) {
      socket.emit('doneConnection', { message: 'hello' });
      socket.on('join', function(data) {
        var editorServer = syncServers[data.fileTabId];
        if (!editorServer) {
          editorServer = new ot.EditorSocketIOServer("", [], data.fileTabId);
          syncServers[data.fileTabId] = editorServer;
        }
        editorServer.addClient(socket);
        editorServer.getClient(socket.id).userSessionId = data.userSessionId;
      });
//      socket.on("getClientUserSessionId", function(data){
//        var editorServer = syncServers[data.fileTabId];
//        socket.emit("returnClientUserSessionId", {editorClientId: data.socketId, clientUserSessionId: editorServer.getClient(data.socketId).userSessionId});
//      });
    });
  });



  Meteor.methods({
    renameUser: function(user_session, user_name){
      SessionUsers.update(
        { _id: user_session },
        { $set: { username: user_name } }
      );
    },

    githubToken: function() {
      try {
        return Meteor.user().services.github.accessToken;
      } catch(e) {
        return null;
      }
    },

    githubUser  : function() {
      try{
        return Meteor.user().services.github;
      }catch(e) {
        return null;
      }
    }
  });
}
