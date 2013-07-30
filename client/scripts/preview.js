var
  //serverAddress = "http://ec2-54-245-222-60.us-west-2.compute.amazonaws.com";
  serverAddress = "http://live.cocodojo.com";
  liveSocket = io.connect(serverAddress, {port: 3333} ),
  serverDirectoryReady = false,
  modifiedFilesCount = -1;

  uploadFiles = function(){
    serverDirectoryReady = true;
    var fileTabs = FileTab.find({});
    modifiedFilesCount = fileTabs.count(); // update modified files count

    if(modifiedFilesCount == 0){ loadPreview(); }
    else {
      $(document).trigger("preview");
      setTimeout(function() {
        fileTabs.forEach(function(d){
          if(d.file.path){
            liveSocket.emit("replaceFile", {
              sessionId: Session.get('codeSessionId'),
              fileString: d.file.content,
              path: d.file.path
            });
          }
        });
      }, 1000);
    }

  },
  loadPreview = function(){
    $('#previewWindow iframe').attr('src', serverAddress+":3333/"+Session.get('codeSessionId'));
    $('#previewWindow').modal('show');
    //window.open(serverAddress+":3333/"+Session.get('codeSessionId'), 'Preview');
  };


Template.preview.rendered = function() {

  liveSocket.on('livePreview', function(data){

    $('#preview-btn').click(function(){

      var
        userSession = Session.get('userSession'),
        codeSession = CodeSession.find({}).fetch();

      if(serverDirectoryReady) { uploadFiles(); }
      else if(codeSession[0].githubHost){
        //var repoAddr = 'https://github.com/'+codeSession[0].githubHost+'/'+codeSession[0].githubRepo+'.git';
        liveSocket.emit("clone", {
          sessionId: Session.get('codeSessionId'),
          repoAddr: 'https://github.com/'+codeSession[0].githubHost+'/'+codeSession[0].githubRepo+'.git',
          repoBranch: codeSession[0].githubBranch
        });
      } else {
        liveSocket.emit("makedir", {
          sessionId: Session.get('codeSessionId')
        });
      }

    });
  });

  // When clone or create directory is finished
  liveSocket.on('serverDirectoryReady', function(data){
    uploadFiles();
  });

  // When all files are saved
  liveSocket.on('fileSaved', function(data){
    if(--modifiedFilesCount == 0){ // if all files are updated
      loadPreview();
    }
  });

};



