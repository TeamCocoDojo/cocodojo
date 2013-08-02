$(document).on("repoSelected", function(){
  $("#selectRepo").hide();
});
Template.githubLogin.repoNotSelected = function (){
  if(cocodojo.githubRepo === undefined)
    return true;
  return false;
};
Template.githubLogin.rendered = function(){
  if (Meteor.currentUser) {
    Meteor.call("githubUser", function(error, user){
      cocodojo.githubUser = user;
      $(document).trigger("updateGithubInfo");
      $(document).trigger("githubObjectCreated");
    });
  }
}
$(document).on("updateGithubInfo", function(evt, repoInfo){
	if(cocodojo.githubUser !== undefined && cocodojo.githubUser.username == cocodojo.codeSessionHost){
    $("#btnCommitBox").css("display", "block");
		$("#btnCommitBox").removeClass("hide");
	}
});
