Template.chatbox.messages = function(){
  return Chatbox.find({});
}

Template.chatbox.events = {
  'keydown #chatbox-input': function(e) {
    if(e.which === 13) {
      if($("#chatbox-input").val() == ""){ return; }
      Chatbox.insert({
        "user": "Anonymous",
        "timestamp": (new Date()).toUTCString(),
        "text": $("#chatbox-input").val()
      });
      $("#chatbox-input").val("");
    }
  }
}