if (Meteor.isClient) {

  Meteor.loginWithGithub({
    requestPermissions: {
      github: ['user', 'public_repo']
    },
    requestOfflineToken: {
      github: true
    }
  });


}

$(document).on('ready', function(){

});


Template.chatbox.rendered = function(){
  $('#chatbox-container .chatbox-min').on('click', function(){
    $('#chatbox-container').toggleClass('hidden');
  });
}
