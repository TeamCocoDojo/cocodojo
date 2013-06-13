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

}