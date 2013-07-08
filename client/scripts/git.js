console.log("In testing GIT");
var repo =new Git.GithubProxyRepo("lydian", "otServer", "test");

var origin = repo.getRemote("origin");
origin.fetchRefs(function() {
  refs = repo.getAllRefs();
});


