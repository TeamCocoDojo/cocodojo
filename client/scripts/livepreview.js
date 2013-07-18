var liveSocket = io.connect("http://ec2-54-245-222-60.us-west-2.compute.amazonaws.com", {port: 8888});
liveSocket.on('news', function(data){
  console.log(data);
  liveSocket.emit("clone", {userSessionId: Session.get("userSession")} );
});

