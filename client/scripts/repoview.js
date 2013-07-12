var DataSource = function (owner, repoName, element) {
  if(cocodojo.githubObj === undefined){
    cocodojo.githubObj = new GithubLib({});
  }
  this.repo = cocodojo.githubObj.getRepo(owner, repoName);
  this.element = element;
  element.empty();
  this.data({});
}
DataSource.prototype.getContent = function (sha, callback) {
  this.repo.getBlob(sha, callback);
};
DataSource.prototype.callback = function (options) {
  var me = this;
  options.element.empty();
  for (var i = 0; i< options.data.length; i++){
    var data = options.data[i];
    if(data.type == 'folder'){
      var header = $("<div></div>").addClass('tree-folder-header').append("<i class='icon-folder-close'></i>").append("<div class='tree-folder-name'>" + data.name + "</div>");
      var content = $("<div></div>").addClass('tree-folder-content');
      var element = $("<div></div>").addClass('tree-folder');
      header.appendTo(element);
      content.appendTo(element);
      header.click(function(evt){
        var element = $($(this).parents(".tree-folder")[0]);
        var selectedItem = element.data();
        me.data({sha: selectedItem.sha, path: selectedItem.path, element: $(element.find(".tree-folder-content")[0])});
      });
    }
    else{
      var element = $("<div></div>").addClass('tree-item').append("<i class='tree-dot'></i>").append("<div class='tree-item-name'>" + data.name + "</div>");
      element.click(function(evt){
      var selectedItem = $(this).data();
        me.getContent(selectedItem.sha, function(err, data){
          $(document).trigger("repoFileSelected", {name: selectedItem.name, sha:selectedItem.sha, content: data, path:selectedItem.path});
        });
      });
    }
    element.appendTo(options.element);
    element.data(data);
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
Template.repoview.events({
  'click #login': function (evt) {
    Meteor.loginWithGithub({
    requestPermissions: ['user', 'public_repo']
    },function (err) {
      if (err){
        alert(err);
        console.log(err);
      }
    });
    evt.preventDefault();
  },
  'click #logout': function (evt) {
    Meteor.logout(function (err) {
      if (err)
        Meteor._debug(err);
    });
    evt.preventDefault();
  }
});
function setGithubFileTree(fields){
  if(!cocodojo.isSet){
    cocodojo.isSet = true;
    return;
  }

  if(fields.githubRepo === undefined) return;
  var githubRepo = fields.githubRepo;
  var githubHost = fields.githubHost || cocodojo.githubHost || "";
  if( cocodojo.githubRepo=== undefined || cocodojo.githubRepo != githubRepo ){
    cocodojo.githubRepo = githubRepo;
    var dataSource = new DataSource( githubHost, githubRepo, $("#ex-tree"));
    $(document).trigger("repoSelected", {owner: githubHost, name: githubRepo  });
    $('#repoTree').modal('hide');
  }
  if(githubHost != "")  
    cocodojo.githubHost = githubHost;
};

Template.repoview.rendered = function() {
  CodeSession.find({_id: Session.get("codeSessionId")}).observeChanges({
    added: function(id, fields){ 
      setGithubFileTree(fields);
    },
    changed:function (id, fields){
      setGithubFileTree(fields);
    }
  });
};
$(document).on("updateGithubInfo", function(evt){
  if(cocodojo.githubUser == cocodojo.repoHost){
    $("#btnCommitBox").removeClass("hide");
  }
});
