Template.chatbox.messages = function(){
  return Chatbox.find({});
};

Template.chatbox.rendered = function(){
  $('#chatbox-container .chatbox-content')[0].scrollTop = 99999;
}

Template.chatbox.events = {
  'keydown #chatbox-input': function(e) {
    if(e.which === 13) {
      if($("#chatbox-input").val() == ""){ return; }
      Chatbox.insert({
        "codeSessionId": Session.get("codeSessionId"),
        "user": Session.get('username'),
        "timestamp": new Date(),
        "text": $("#chatbox-input").val()
      });
      $("#chatbox-input").val("");
    }
  },
  'click .chatbox-header': function(e) {
    $('#chatbox-container').toggleClass('hidden');
    $('#chatbox-container .chatbox-content')[0].scrollTop = 99999;
  }
};
