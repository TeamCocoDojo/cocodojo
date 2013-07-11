Template.repoTree.rendered = function() {
  $('#repoTree').on('show', function () {
    Meteor.call("githubUser", function(error, user){
      cocodojo.githubObj = new GithubLib({
        token: user.accessToken,
        auth: "oauth"
      });
      $(document).trigger("githubObjectCreated", {github:cocodojo.githubObj});
    });
  });
}
$(document).on("githubObjectCreated", function(){
  var user = cocodojo.githubObj.getUser();
  user.repos(function(err, repos) {
    var ul = $("#repo-list");
    ul.empty();
    repos.forEach(function(repo) {
      var li = $("<li/>");
      var a = $("<a/>");
      a.text(repo.full_name);
      a.attr("data-name", repo.name);
      a.attr("data-owner", repo.owner.login);
      ul.append(li);
      li.append(a);
    });
    ul.find("a").click(function() {
      var repoName = $(this).attr("data-name");
      var repoOwner = $(this).attr("data-owner");
      console.log(Session.get("codeSessionId"));
      CodeSession.update({_id: Session.get("codeSessionId")}, {githubHost: repoOwner, githubRepo: repoName});
    });
  });
});
