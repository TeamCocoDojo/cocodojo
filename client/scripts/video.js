Template.video.users = function(){
  console.log(CodeSession.findOne({}));
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
