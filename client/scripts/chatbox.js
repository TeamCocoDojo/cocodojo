Template.chatbox.messages = function() {
  console.log(Chatbox.find({}));
  return Chatbox.find({});
};

Template.chatbox.rendered = function(){
  $('#chatbox-container .chatbox-content')[0].scrollTop = 99999;
  if(Chatbox.find({}).count() != 0){
    $('#chatbox-container .chatbox-header').css('background-color', '#003366');
  }
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
    $('#chatbox-container .chatbox-header').css('background-color', '#333');
  },
  'focus #chatbox-container': function(e){
    $('#chatbox-container .chatbox-header').css('background-color', '#333');
  }
};
