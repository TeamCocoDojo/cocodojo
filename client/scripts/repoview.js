$(document).on("repoSelected", function(e, repoInfo) {
  //Put your logic here
  console.log(repoInfo.name + ": " + repoInfo.owner );
  var repo = cocodojo.githubObj.getRepo(repoInfo.owner, repoInfo.name);
  repo.getTree('master', function(err, tree){
    console.log(tree);
  });

});

Template.repoview.rendered = function() {

};
