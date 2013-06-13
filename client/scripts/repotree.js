Template.repoTree.rendered = function() {
  $('#repoTree').on('show', function () {
    cocodojo.githubAPIObj = new cocodojo.githubAPI(Meteor.user().services.github.accessToken);
  });
}



// Meteor.autorun(function () {
//   if (Meteor.user() && Meteor.user().services) {
//     
//     cocodojo.githubAPIObj.getRepos(function(repos) {
//     var allRepo = [];
//     for (var i = 0; i < repos.data.length; i++) {
//         var repo = {
//           name: repos.data[i].name,
//           type: "folder",
//         };
//         allRepo.push(repo);
//     }
//     var dataSourceTree = new TreeDataSource({
//       data: allRepo,
//       delay: 400
//     });

//     $('#repo-tree').tree({
//         dataSource: dataSourceTree,
//         loadingHTML: '<div class="static-loader">Loading...</div>',
//         multiSelect: true,
//         cacheItems: true
//       });
//     });
//   } else {
//     // on logout
//   }
// });