var
  //serverAddress = "http://ec2-54-245-222-60.us-west-2.compute.amazonaws.com";
  serverAddress = "http://live.cocodojo.com";
  liveSocket = io.connect(serverAddress, {port: 3333} ),
  //modifiedFiles = -1;


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
      $(document).trigger("preview");
      var fileTabs = FileTab.find({});
      //modifiedFiles = fileTabs.count(); // update modified files count
      setTimeout(function(){
        fileTabs.forEach(function(d){
          if(d.file.path){
            liveSocket.emit("replaceFile", {
              sessionId: Session.get('codeSessionId'),
              fileString: d.file.content,
              path: d.file.path
            });
            //console.log(d.file.content);
          }
        });
      }, 3000);

      setTimeout(function(){
        window.open(serverAddress+":3333/"+Session.get('codeSessionId'),'Preview');
      }, 6000);

    });
  });

  //liveSocket.on('fileSaved', function(data){
    //if(--modifiedFiles == 0){ // if all files are updated
      //window.open(serverAddress+":3333/"+Session.get('codeSessionId'),'Preview');
    //}
  //});

};



