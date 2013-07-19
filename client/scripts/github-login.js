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
    cocodojo.githubUser = user;
    $(document).trigger("updateGithubInfo");
    $(document).trigger("githubObjectCreated" );
  });
}
