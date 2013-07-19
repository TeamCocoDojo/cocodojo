var 
  serverAddress = "http://ec2-54-245-222-60.us-west-2.compute.amazonaws.com";
  liveSocket = io.connect(serverAddress, {port: 3333} );

  Template.preview.rendered = function() {
    liveSocket.on('livePreview', function(data){
    $('#preview-btn').click(function(){
      
      var codeSession = CodeSession.find({}).fetch();
      if(codeSession[0].githubHost){
        var repoAddr = 'https://github.com/'+codeSession[0].githubHost+'/'+codeSession[0].githubRepo+'.git';
        //console.log(repoAddr);
        liveSocket.emit("clone", {
          sessionId: Session.get('codeSessionId'), 
          repoAddr: repoAddr
        });
      } else { 
        liveSocket.emit("makedir", {
          sessionId: Session.get('codeSessionId')
        });
      }

      // Upload and replace edited files
      var fileTabs = FileTab.find({});
      setTimeout(function(){
        fileTabs.forEach(function(d){
          if(d.file.path){
            liveSocket.emit("replaceFile", {
              sessionId: Session.get('codeSessionId'),
              fileString: d.file.content, 
              path: d.file.path
            }); 
            console.log(d.file.content);
          }
        });
      }, 3000);

      // Open preview window (temporary)
      setTimeout(function(){
        window.open(serverAddress+"/"+Session.get('codeSessionId'),'Preview');
      }, 6000);

    });
  });
};



