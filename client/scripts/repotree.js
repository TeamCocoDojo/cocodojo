Template.repoTree.rendered = function() {
  $('#repoTree').on('show', function () {
    cocodojo.githubAPIObj.getRepos(function(data) {
      var ul = $("#repo-list");
      var repos = JSON.parse(data.content);
      repos.forEach(function(repo) {
        var li = $("<li/>");
        var a = $("<a/>");
        a.text(repo.full_name);
        a.attr("data-id", repo.id);
        ul.append(li);
        li.append(a);
      });
    });
  });
}


