Template.video.users = function(){
  console.log(SessionUsers.find({}).fetch());
  return SessionUsers.find({});
};
