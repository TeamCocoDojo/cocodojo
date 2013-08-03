Template.userList.users = function(){
  var
    userList = [];
    sessionUsers = SessionUsers.find({});

  sessionUsers.forEach(function(user){
    userList.push({
      _id: user._id,
      userId: user.userId,
      userColor: user.userColor,
      initial: user.username.slice(0, 1).toUpperCase(),
      username: user.username,
      isMe: (Session.get('userSession') == user._id)
    });
  });

  for(var i=0; i<userList.length; ++i){
    if(userList[i].isMe){
      var tmp = userList[i];
      userList[i] = userList[0];
      userList[0] = tmp;
      break;
    }
  }

  return userList;
};

Template.userList.rendered = function(){
  $('.user-instance').on('mouseenter', function(){
    $(this).tooltip('show');
  });
};

Template.userList.events = {
  'click #my-user-instance': function(e) {
    var newUsername = window.prompt("Set Username", Session.get("username"));
    if(newUsername != null && $.trim(newUsername) != ""){
      Meteor.call('renameUser', Session.get('userSession'), newUsername);
      Session.set("username", newUsername);
      localStorage['username'] = newUsername;
    }
  }
};
