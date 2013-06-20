CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");

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

  var io = socketIO.listen(3333);
  var syncServers = {};
  io.set('origins', process.env.origin || '*:*');
  io.sockets.on('connection', function(socket) {

    socket.emit('doneConnection', { message: 'hello' });

    socket.on('create', function(data) {
      var editorServer = new ot.EditorSocketIOServer("", [], data.codeSessionId);
      syncServers[data.codeSessionId] = editorServer;
      socket.emit('doneCreate', {});
    });

    socket.on('join', function(data) {
      if (syncServers[data.codeSessionId]) {
        var editorServer = syncServers[data.codeSessionId];
        editorServer.addClient(socket);
      }
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

    getSocketIOHost: function() {
      return process.env.SOCKETIO_HOST || "localhost";
    },

    getSocketIOPort: function() {
      return process.env.SOCKETIO_PORT || 3333;
    }

  });


}
