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
      username: user.username
    });
    console.log(user);
  });

  return userList;
};

Template.userList.rendered = function(){
  $('.user-instance').on('mouseenter', function(){
    //console.log("test");
    $(this).tooltip('show');
  });
};
