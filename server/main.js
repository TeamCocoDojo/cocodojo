CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");
WhiteboardCursor = new Meteor.Collection("whiteboard_cursor");
FileTab = new Meteor.Collection("filetab");
ChangeLog = new Meteor.Collection("changelog");
FileFolder = new Meteor.Collection("filefolder");

if(Meteor.isServer) {
  var getFileTabSocketId = function(record) {
    return (record.file.owner + "_" + record.file.repo + "_" + record.file.path).split('/').join('_');;
  }

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
  Meteor.publish("filefolder", function(code_session_id) {
    check(code_session_id, String);
    return  FileFolder.find({codeSessionId: code_session_id});
  });
  Meteor.publish("filetab", function(code_session_id) {
    check(code_session_id, String);
    return FileTab.find({codeSessionId: code_session_id});
  });
  Meteor.publish("changelog", function(code_session_id) {
    check(code_session_id, String);
    return ChangeLog.find({codeSessionId: code_session_id});
  });

  var io = socketIO.listen(3333);
  var syncServers = {};
  io.set('origins', process.env.origin || '*:*');
  var usedSocketIds = {};
  var sessionUsers = {};

  var allCodeSession = CodeSession.find({});
  allCodeSession.observeChanges({
    added: function(id, record) {
      io.of('/sesssion' + id).on('connection', function(socket) {
        console.log("!!!!!!!!!!!!!");
        socket.on('commit', function() {
          console.log("commit");
          var users = SessionUsers.find({codeSessionId: id});
          sessionUsers[id] = users.count();
        }).on('finishCommit', function() {
          console.log("finishCommit");
          sessionUsers[id] = sessionUsers[id] - 1;
          if (sessionUsers[id] == 0) {
            socket.emit('doneCommit');
          }
        })
      });
    },
    changed: function(id, change) {
      FileTab.remove({codeSessionId: id, "file.noClose": true}, function(error) {
        if (error) {
          console.log(error);
        }
      });
    }
  });

  var fileTabQuery = FileTab.find({});

  fileTabQuery.observeChanges({
    added: function (id, record) {
      var socketId = getFileTabSocketId(record);
      if (!(socketId in usedSocketIds)) {
        usedSocketIds[socketId] = true;
        io.of('/filesync' + socketId).on('connection', function(socket) {
          socket.emit('doneConnection', { message: 'hello' });
          socket.on('join', function(data) {
            var editorServer = syncServers[data.fileId];
            if (!editorServer) {
              editorServer = new ot.EditorSocketIOServer(record.file.content || "", [], data.fileId);
              syncServers[data.fileId] = editorServer;
            }
            editorServer.addClient(socket);
            editorServer.getClient(socket.id).userSessionId = data.userSessionId;
          }); 
        });
      }
      if (!record.isReady) {
        FileTab.update(record, {$set: {isSocketReady: true}});
      }
    }
  });

  var changelogs = ChangeLog.find({});
  changelogs.observeChanges({
    added: function(id, record) {
      if (!record.isOld) {
        ChangeLog.update({_id: id}, {$set: {isOld: true}});
      } 
    }
  });

  Meteor.methods({
    saveAllFileTabs: function(records, contents) {
      for (var key in records) {
        var record = records[key];
        var content = contents[key];

        FileTab.update(
          {_id: record.fileTab},
          {$set: {"file.content": content}}
        );
      }
    },

    closeFileTab: function(record, content) {
      FileTab.update(
        {_id: record.fileTab},
        {$set: {"file.content": content, "isOpen": false}}
      );
    },

    removeTabs: function(codeSessionId, userId) {
      FileTab.remove({codeSessionId: codeSessionId, userId: userId, "file.noClose": true}, function(error) {
        if (error) {
          console.log(error);
        }
      });
    },

    renameFileTab: function(record, name) {
      FileTab.update(
        {_id: record.fileTab},
        {$set: {"file.name": name}}
      );
    },

    reOpenFileTab: function(record) {
      FileTab.update(
        {_id: record.fileTab},
        {$set: {isOpen: true}}
      );
    },

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

    githubUser: function() {
      try{
        return Meteor.user().services.github;
      }catch(e) {
        return null;
      }
    }
  });
}
