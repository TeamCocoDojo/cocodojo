Template.repoTree.rendered = function() {
  $('#repoTree').on('show', function () {
    cocodojo.githubAPIObj = new cocodojo.githubAPI(Meteor.user().services.github.accessToken);
  });
}

