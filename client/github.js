var cocodojo = cocodojo || {};

cocodojo.github = cocodojo.github || {};

cocodojo.github.getAccessToken = function() {
  if (Meteor.user()) {
    var user = Meteor.user();
    return user.services.github.accessToken;
  }
};

cocodojo.github.getUsername = function() {
  if (Meteor.user()) {
    var user = Meteor.user();
    return user.services.github.username;
  }
};

cocodojo.github.getRepos = function() {
  Meteor.http.get("https://api.github.com/user/repos?access_token=" + cocodojo.github.getAccessToken(),
    function (error, result) {
      if (result.statusCode === 200) {
        console.log(result);
      }
    });
};

Template.contents.events({
  'click input' : function () {
    cocodojo.github.getRepos();
  }
});