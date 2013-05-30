if (Meteor.isClient) {

  Meteor.loginWithGithub({
      requestPermissions: {
        github: ['user', 'public_repo']
      },
      requestOfflineToken: {
        github: true
      }
    }
  );
}

if (Meteor.isServer) {
   Meteor.startup(function () {
      // code to run on server at startup
   });

}
