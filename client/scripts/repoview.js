var DataSource = function (owner, repoName, element) {
  this.repo = cocodojo.githubObj.getRepo(owner, repoName);
  this.element = element;
  element.empty();
  this.data({});
}
DataSource.prototype.getContent = function (sha, callback) {
  this.repo.getBlob(sha, callback);
};
DataSource.prototype.callback = function (options) {
  for (var i = 0; i< options.data.length; i++){
    var data = options.data[i];
    if(data.type == 'folder'){
      var header = $("<div></div>").addClass('tree-folder-header').append("<i class='icon-folder-close'></i>").append("<div class='tree-folder-name'>" + data.name + "</div>");
      var content = $("<div></div>").addClass('tree-folder-content');
      var element = $("<div></div>").addClass('tree-folder');
      header.appendTo(element);
      content.appendTo(element);
    }
    else{
      var element = $("<div></div>").addClass('tree-item').append("<i class='tree-dot'></i>").append("<div class='tree-item-name'>" + data.name + "</div>");
      var me = this;
      element.click(function(evt){
        $(document).trigger("")
      })
    }
    element.appendTo(options.element);
  }

};
DataSource.prototype.data =  function (options, callback) {
  var self = this;
  var sha = options.sha || "master";
  var element = options.element || this.element;
  options.path = options.path || "";
  this.repo.getTree(sha, function(err, tree){
    var data = tree.map(function(item){
      return {
        path: options.path + item.path + ((item.type == "blob")?"":"/"),
        name: item.path,
        sha: item.sha,
        type: (item.type == "blob")?"item":"folder" 
      };
    });
    self.callback({ data: data, element: element, start: 0, end: 0, count: 0, pages: 0, page: 0 });
  });
}

$(document).on("repoSelected", function(e, repoInfo) {
  //Put your logic here
  var dataSource = new DataSource(repoInfo.owner, repoInfo.name, $("#ex-tree"));
  $('#repoTree').modal('hide');
  /*
  $('#ex-tree').tree({ dataSource: dataSource }).on("selected", function(event, selectedObjs){
    var selectedItem = selectedObjs.info[0];
    dataSource.getContent(selectedItem.sha, function(err, data){
      $(document).trigger("repoFileSelected", {name: selectedItem.name, sha:selectedItem.sha, content: data, path:selectedItem.path});
    });
  });
  */
});

Template.repoview.rendered = function() {

};
