Npm.depends({"socket.io": '0.9.16'});

Package.on_use(function(api) {
  api.add_files('socket.io-sdk.js', 'server');
});
