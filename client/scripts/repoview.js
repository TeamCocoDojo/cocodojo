var DataSource = function (owner, repoName) {
  this.repo = cocodojo.githubObj.getRepo(owner, repoName);
}
DataSource.prototype.getContent = function (sha, callback) {
  this.repo.getBlob(sha, callback);
};
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

$(document).on("repoSelected", function(e, repoInfo) {
  console.log("repoSelected");
  //Put your logic here
  var dataSource = new DataSource(repoInfo.owner, repoInfo.name);
  $('#repoTree').modal('hide');
  $('#ex-tree').tree({ dataSource: dataSource }).on("selected", function(event, selectedObjs){
    var selectedItem = selectedObjs.info[0];
    console.log("item selected");
    dataSource.getContent(selectedItem.sha, function(err, data){
      $(document).trigger("repoFileSelected", {name: selectedItem.name, sha:selectedItem.sha, content: data});
    });
  });
});

Template.repoview.rendered = function() {

};
