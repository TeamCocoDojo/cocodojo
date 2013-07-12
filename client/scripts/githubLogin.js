$(document).on("repoSelected", function(){
  $("#selectRepo").hide();
});
Template.githubLogin.repoNotSelected = function (){
  if(cocodojo.githubRepo === undefined)
    return true;
  return false;
};
Template.githubLogin.rendered = function(){
  Meteor.call("githubUser", function(error, user){
    cocodojo.githubUser = user.username;
    cocodojo.githubObj = new GithubLib({
      token: user.accessToken,
      auth: "oauth"
    });
    $(document).trigger("updateGithubInfo");
    $(document).trigger("githubObjectCreated", {github:cocodojo.githubObj});
  });
}
