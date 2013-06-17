var DataSource = function (owner, repoName) {
  this.repo = cocodojo.githubObj.getRepo(owner, repoName);
}
DataSource.prototype.data =  function (options, callback) {
  var self = this;
  var sha = options.sha || "master";
  this.repo.getTree(sha, function(err, tree){
    var data = tree.map(function(item){
      return { 
        name: item.path,
        sha: item.sha,
        type: (item.type == "blob")?"item":"folder" 
      };
    });
    callback({ data: data, start: 0, end: 0, count: 0, pages: 0, page: 0 });
  });
}

Template.repoview.rendered = function() {
  $(document).on("repoSelected", function(e, repoInfo) {
    //Put your logic here
    var dataSource = new DataSource(repoInfo.owner, repoInfo.name);
    $('#repoTree').modal('hide');
    $('#ex-tree').tree({ dataSource: dataSource });
  });
};
