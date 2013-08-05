CodeSession = new Meteor.Collection("codesession");
SessionUsers = new Meteor.Collection("sessionusers");
Chatbox = new Meteor.Collection("chatbox");
Whiteboard = new Meteor.Collection("whiteboard");
WhiteboardCursor = new Meteor.Collection("whiteboard_cursor");
FileTab = new Meteor.Collection("filetab");
ChangeLog = new Meteor.Collection("changelog");
FileFolder = new Meteor.Collection("filefolder");

if(Meteor.isServer) {
  var sessionUsersMap = {};
  var currentUserMap = {};

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
        sessionUsersMap[code_session_id] = sessionUsersMap[code_session_id] - 1;
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

  var allSessionUsers = SessionUsers.find({});
  allSessionUsers.observe({
    added: function(record) {
      if (!sessionUsersMap[record.codeSessionId]) {
        sessionUsersMap[record.codeSessionId] = 0;
      }
      sessionUsersMap[record.codeSessionId] = sessionUsersMap[record.codeSessionId] + 1;
    }
  });

  var allCodeSession = CodeSession.find({});
  allCodeSession.observe({
    added: function(record) {
      io.of('/sesssion' + record._id).on('connection', function(socket) {
        socket.on('commit', function(codeSessionId) {
          return function() {
            currentUserMap[codeSessionId] = 0;
          }
        }(record._id))
        .on('finishCommit', function(codeSessionId) {
          return function() {
            currentUserMap[codeSessionId] = currentUserMap[codeSessionId] + 1;
            console.log(currentUserMap);
            if (currentUserMap[codeSessionId] == sessionUsersMap[codeSessionId]) {
              socket.emit('doneCommit');
            }
          }
        }(record._id));
      });
    },
    changed: function(oldDoc, newDoc) {
      FileTab.remove({codeSessionId: oldDoc._id, "file.noClose": true}, function(error) {
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
      try {
        return Meteor.user().services.github;
      } catch(e) {
        return null;
      }
    },
    initGithubFolderList: function(codeSessionId) {
      var codeSession = CodeSession.findOne({"_id": codeSessionId});
      var fut = new Future();
      console.log(codeSession);
      github.authenticate({
        type: "oauth",
        token: codeSession.githubToken
      });
      github.gitdata.getTree({
        user:codeSession.githubHost,
        repo:codeSession.githubRepo,
        sha:codeSession.githubBranch, 
        recursive:true
      }, function (){
        fut.ret(arguments);
      });
      var result = fut.wait();
      var err = result[0], result = result[1];
      if(err) return;
      var tree  = result.tree;
      tree.sort(function(a, b){
        return a.path.localeCompare(b.path);
      });
      for(var i=0; i< tree.length; i++) {
        var item = tree[i];
        var pathes = item.path.split("/");
        FileFolder.insert({
          codeSessionId: codeSessionId,
          type: (item.type=="blob") ? "file" : "folder",
          path: item.path, 
          name: pathes[pathes.length-1],
          sha: item.sha
        });
      }
    },
    getGithubContent: function(codeSessionId, path) { 
      var codeSession = CodeSession.findOne({"_id": codeSessionId});
      github.authenticate({
        type: "oauth",
        token: codeSession.githubToken
      });

      var fut = new Future();
      github.repos.getContent({
        user:codeSession.githubHost,
        repo:codeSession.githubRepo,
        path:path,
        ref: codeSession.githubBranch
      }, function (err, result){
        console.log(arguments);
        if(result.encoding == "base64"){
          var rows = result.content.split("\n");
          var contents = [];
          for(var i=0; i< rows.length; i++ ) {
            contents.push(new Buffer(rows[i], 'base64').toString("utf8"));
          }
          result.content = contents.join("");
          console.log(result.content, "AAAAAAAAAAA");
          result.encoding = "utf-8";
          console.log(result, "CCCCCCCCCC");
        }
        console.log(result, "BBBBBBBBB");
        fut.ret(result);
      });

      return fut.wait();
    }
  });
}
