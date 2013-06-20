Template.repoTree.rendered = function() {
  $('#repoTree').on('show', function () {
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
        $(document).trigger("repoSelected", {name: repoName, owner:repoOwner});
      });
    });
  });
}
