Template.video.users = function(){
  var 
    session = CodeSession.findOne({}),
    html = "";

  if(session){
    for(var i=0; i<session.users.length; ++i){
      html += session.users[i] + ' ';	
    }
  }
  
  return html;
  
};
