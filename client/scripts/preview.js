var
  //serverAddress = "http://ec2-54-245-222-60.us-west-2.compute.amazonaws.com";
  serverAddress = "http://live.cocodojo.com";
  liveSocket = io.connect(serverAddress, {port: 3333} ),
  serverDirectoryReady = false,
  modifiedFilesCount = -1,
  eventsRegistered = false,
  previewWindow = undefined,
  previewType = 'popup',

  uploadFiles = function(){

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
    switch(previewType){
      case 'modalbox':
        $('#previewWindow iframe').attr('src', serverAddress+":3333/"+Session.get('codeSessionId'));
        $('#previewWindow').modal('show');
        break;
      case 'popup':
        if(previewWindow == undefined || previewWindow.closed){
          previewWindow = window.open(serverAddress+":3333/"+Session.get('codeSessionId'), 'Preview');
        } else {
          previewWindow.location = serverAddress+":3333/"+Session.get('codeSessionId');
        }
        break;
    }
  };



Template.preview.rendered = function() {

  if(!eventsRegistered){

    $('#select-modalbox .icon-ok').hide();

    liveSocket.on('livePreview', function(data){

      $('#preview-btn').click(function(e){
        var
          userSession = Session.get('userSession'),
          codeSession = CodeSession.find({}).fetch();

        if(serverDirectoryReady) { uploadFiles(); }
        else if(codeSession[0].githubHost){
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
      serverDirectoryReady = true;
      uploadFiles();
    });

    // When all files are saved
    liveSocket.on('fileSaved', function(data){
      if(--modifiedFilesCount == 0){ // if all files are updated
        loadPreview();
      }
    });

    eventsRegistered = true;
  }

};

Template.preview.events = {
  'click #select-modalbox': function(e) {
    $('#select-popup .icon-ok').hide();
    $('#select-modalbox .icon-ok').show();
    previewType = "modalbox";
  },
  'click #select-popup': function(e) {
    $('#select-modalbox .icon-ok').hide();
    $('#select-popup .icon-ok').show();
    previewType = "popup";
  }
};


