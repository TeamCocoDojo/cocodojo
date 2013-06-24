CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");
WhiteboardCursor = new Meteor.Collection("whiteboard_cursor");

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

  var io = socketIO.listen(3333);
  var syncServers = {};
  io.set('origins', process.env.origin || '*:*');
  io.of('/editor').on('connection', function(socket) {

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
        editorServer.getClient(socket.id).userSessionId = data.userSessionId;
      }
    });
    socket.on("getClientUserSessionId", function(data){
        var editorServer = syncServers[data.codeSessionId];
        socket.emit("returnClientUserSessionId", {editorClientId: data.socketId, clientUserSessionId: editorServer.getClient(data.socketId).userSessionId});
    });
  });

  //////// begin of video session
  
  // OpenTok Variables
  var OPENTOK_API_KEY = '413302',   // Replace with your API key
   OPENTOK_API_SECRET = 'fc512f1f3c13e3ec3f590386c986842f92efa7e7',    // Replace with your API secret

  // OpenTok SDK
  openTokSDK = new openTok.OpenTokSDK(OPENTOK_API_KEY, OPENTOK_API_SECRET),
  
  // NOTE: Uncomment for production, defaults to "staging.tokbox.com"
  // openTokSDK.setEnvironment("api.tokbox.com"),
  
  // Variables for managing OpenTok Sessions
  MAX_SESSION_CONNECTIONS = 3,  // Maximum number of client connections we want in a given session  
  sessionMap = {},        // mapping from CoCoDoJo session id to OpenTok session object {sessionId, count}
  ot_sessions = new Array();    // Array for holding all sessions we have generated

  // Finds an available session for the client to connect to
  function getSession(client, cocodojoSessionId) {
    
    console.log("inside getSession. cocodojoSessionId is: " + cocodojoSessionId);

    var session;
    // Look through all sessions to find a session that has less than the max number of sessions
    // NOTE: We start searching from the top of the array since it is more likely a non-full session is there
    // for (var i = ot_sessions.length - 1; i >= 0; i--) {
    //  var tmp_session = ot_sessions[i];
    //  if (tmp_session.clients.length < MAX_SESSION_CONNECTIONS) {
    //    session = tmp_session;
    //    break;
    //  }
    // }
    
    if (cocodojoSessionId in sessionMap) {
      // if we already have opened a OpenTok Session for this CoCoDoJo Session, enter this session
      var otSessionId = sessionMap[cocodojoSessionId].sessionId;
      sessionMap[cocodojoSessionId].count += 1;
      enterSession(otSessionId, client);
    } else {
      // this is a new CoCoDoJo Session, create a OpenTok session for it
      openTokSDK.createSession('localhost',{},function(otSessionId) {
        sessionMap[cocodojoSessionId] = { sessionId : otSessionId, count : 1 };
        enterSession(otSessionId,client);
      })
    }
  }

  // Sends the otSessionId info back to the client for the client to join
  function enterSession(otSessionId, client) {
    // Construct info object to pass back to client then send it
    console.log("otSessionId:"+otSessionId);
    var opentok_info = {
      "sessionId": otSessionId,
      "apiKey": OPENTOK_API_KEY,
      "token": openTokSDK.generateToken()
    }
    client.emit("message", opentok_info);
  }

    // Finds which otSessionId the client was in and removes the client from that otSessionId.
  function leaveSession(client) {
    console.log("====" + client + " left this session");
    // Find the otSessionId that the client was in
    // var otSessionId = session_map[client.otSessionId];
    
    // // Find the position of the client in the otSessionId
    // var index = otSessionId.clients.indexOf(client.otSessionId);
    
    // // Remove the client from the otSessionId
    // otSessionId.clients.splice(index, 1);
  }

  // video connection
  io.of('/video').on('connection', function(client) {
    
    // When a client connects, figure out which session to join
    client.on('codeSession', function (data) {
      var codeSessionId = data.codeSessionId;
      console.log("CoCoDoJo Session id: " + data.codeSessionId);
      // getSession(client, codeSessionId);
    });
    client.on('disconnect', function() {
      // When a client disconnects, drop that client from the session
      // leaveSession(client);
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
