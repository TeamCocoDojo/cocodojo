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

$(window).load(function(){

});
