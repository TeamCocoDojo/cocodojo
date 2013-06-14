Template.video.users = function(){
  console.log(SessionUsers.find({}).fetch());
  var
    session = SessionUsers.findOne({}),
    html = "";

  /*if(session){
    for(var i=0; i<session.users.length; ++i){
      html += session.users[i] + ' ';
    }
  }*/

  return html;

};
