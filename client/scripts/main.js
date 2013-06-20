Meteor.startup(function () {
  $(document).ready(function() {
    $('#content').css('height', $('body').height()-62+'px');
    $(window).resize(function() {
      $('#content').css('height', $('body').height()-62+'px');
    });
  });
});

Meteor.call("githubUser", function(error, user){
  if(user){
    cocodojo.githubObj = new GithubLib({
      token: user.accessToken,
      auth: "oauth"
    });
  }
});
