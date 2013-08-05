var FolderList = function (owner, repoName, branch, element) {
  this.branch = branch;
  this.owner = owner;
  this.repoName = repoName;
  this.element = element;
  this.folders = {};
  element.empty();
}
FolderList.prototype.getRepo = function(){
  var githubObj = cocodojo.getGithubObj();
  return githubObj.getRepo(this.owner, this.repoName);
}
FolderList.prototype.getContent = function (path, callback) {
  Meteor.call("getGithubContent", Session.get("codeSessionId"), path, function(err, result) {
    console.log(result);
    callback(err, result);
  });
};

FolderList.prototype.addToFolderList = function ( data ) {
  var file = FileFolder.findOne({path: data.path});
  var pathes = data.path.split("/");
  var targetFolder = this.element;
  for(var i=0; i< pathes.length-1; i++){
    targetFolder = $(_.filter(targetFolder.children(".tree-folder"), function(item) {
      return $($($(item).children(".tree-folder-header")[0]).children(".tree-folder-name")[0]).text() == pathes[i];
    })[0]).children(".tree-folder-content");
  }
  if($("#" + file._id).length > 0 ) return ;
  if(data.type == "file") 
    var includeItem = cocodojo.folderlist.createFileItem(data);
  else
    var includeItem = cocodojo.folderlist.createFolderItem(data)
  includeItem.attr("id", file._id);
  if(targetFolder.children(":contains('" + data.name + "')").length >0 && 
     $(targetFolder.children(":contains('" + data.name + "')")[0]).text() == data.name ) return; 

    targetFolder.append(includeItem);
    $.contextMenu({
      selector: '.tree-item',
      items: {
        /*"rename": {
          name: "Rename File",
          callback: function() {
            var fileName = window.prompt("Please input the name of the file");
            if (fileName) {
              var fullPath = $(this).data("path") + "/" +fileName;
              $(document).trigger("renameFile", fullPath);
            }
          }
        },*/
        "delete": {
          name: "Delete File",
          callback: function() {
            var fullPath = $(this).data("path");
            $(document).trigger("deleteFile", $(this).data());
          }
        }
      }
    });
    $.contextMenu({
      selector: '.tree-folder-header',
      items: {
        "add": {
          name: "Add File",
          callback: function(key, obj) {
            var item = $(obj.$trigger[0]);
            var fileName = window.prompt("Please input the name of the file");
            if (fileName) {
              var fullPath = item.data("path") + "/" +fileName;
              $(document).trigger("addFile", {path: fullPath, name: fileName});
            }
          }
        }/*,
        "rename": {
          name: "Rename Directory",
          callback: function() {
            var fileName = window.prompt("Please input the name of the file");
            if (fileName) {
              var fullPath = $(this).data("path") + fileName
              $(document).trigger("renameFile", fullPath);
            }
          }
        },
        "delete": {
          name: "Delete Directory",
          callback: function(key, obj) {
            var item = $(obj.$trigger[0]);
            var fullPath = item.data("path") ;
            $(document).trigger("deleteFile", fullPath);
          }
        }*/
      }
    });
}

FolderList.prototype.createFolderItem = function ( data ) {
  var me = this;
  var header = $("<div/>").addClass('tree-folder-header').append("<i class='icon-folder-close'></i>").append("<div class='tree-folder-name'>" + data.name + "</div>");
  var content = $("<div/>").addClass('tree-folder-content').hide();
  var element = $("<div/>").addClass('tree-folder');
  header.attr("data-path", data.path);
  header.data(data);
  header.appendTo(element);
  content.appendTo(element);
  header.click(function(evt){
    var element = $($(this).parents(".tree-folder")[0]);
    $(element.find(".tree-folder-content")[0]).toggle();
    var selectedItem = element.data();
    me.getFolderList({sha: selectedItem.sha, path: selectedItem.path, element: $(element.find(".tree-folder-content")[0])});
  });

  header.mousedown(function(e) {
    if (e.button == 2) {
      e.stopPropagation();
      $("#folder-menu").css("top", $(this).css("top"));
      $("#folder-menu").css("left", $(this).css("left"));
    }
  });
  return element;
};

FolderList.prototype.createFileItem = function (data) {
  var me = this;
  var element = $("<div></div>").addClass('tree-item').append("<i class='tree-dot'></i>").append("<div class='tree-item-name'>" + data.name + "</div>");
  element.data(data);
  element.click(function(evt){
    var selectedItem = $(this).data();
    if(selectedItem.status == "new"){
      $(document).trigger("commitToGit");
      setTimeout(function() {
        var obj = FileTab.findOne({codeSessionId: Session.get("codeSessionId"), "file.path": selectedItem.path});
        $(document).trigger("repoFileSelected", {owner: me.owner, repo: me.repoName ,name: selectedItem.name, content: obj.file.content, path:obj.file.path});
      }, 2000);
    }
    else{
      me.getContent(selectedItem.path, function(err, data){
        $(document).trigger("repoFileSelected", {owner: me.owner, repo: me.repoName ,name: selectedItem.name, sha:selectedItem.sha, content: data.content, path:selectedItem.path});
      });
    }
  });
  return element;
};

FolderList.prototype.getFolderList = function (options, callback){
  if(options.path !== undefined ) {
    var folders = options.path.split("/");
    var folder = this.folders;
    for(var i=0; i< folders.length; i++){
      if (folder[folders[i]] === undefined) break;
      folder = folder[folders[i]];
      if(i==folders.length -1 ) return folder;
    }
  }
  var pathes = (options.path !== undefined )?options.path.split("/"):[];
  var currentFolder = this.folders;
  for(var i=0; i< pathes.length; i++) {
    if(currentFolder[pathes[i]] === undefined) currentFolder[pathes[i]] = {};
    currentFolder = currentFolder[pathes[i]];
  }
}

Template.repoview.events({
  'click #login': function (evt) {
    Meteor.loginWithGithub({
      requestPermissions: ['user', 'public_repo']
    },function (err) {
      if (err){
        alert(err);
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
$(document).on("deleteFile", function(evt, data) {
	var file = FileFolder.findOne({codeSessionId: Session.get("codeSessionId"), path: data.path});
	console.log(file);
	if(data.status == "new"){
		FileFolder.remove({_id: file._id});
	}
	else{
		FileFolder.update({_id: file._id}, {"$set": {status: "removed"}});
	}
});
$(document).on("addFile", function(evt, data) {
  console.log("on add file:", data);
  var fileName = data.name;
  var filePath = data.path;
  FileFolder.insert({
    codeSessionId: Session.get("codeSessionId"),
    type: "file",
    path: data.path, 
    name: data.name,
    status: "new"
  });
  $(document).trigger("doneAddFile", {owner: cocodojo.repoOwner, repo: cocodojo.repoName, name: fileName, content: "", path: filePath});
});

$(document).on("addFolder", function(evt, data) {
  var fileName = data.name;
  var filePath = data.path;
  FileFolder.insert({
    codeSessionId: Session.get("codeSessionId"),
    type: "folder",
    path: data.path, 
    name: data.name,
    status: "new"
  });
  $(document).trigger("doneAddFolder", {owner: cocodojo.repoOwner, repo: cocodojo.repoName, name: fileName, content: "", path: filePath});
});

function setGithubFileTree(fields){
  if(fields.githubRepo === undefined) return;
  var githubRepo = fields.githubRepo;
  var githubHost = fields.githubHost || cocodojo.codeSessionHost || "";
  var githubBranch = fields.githubBranch || cocodojo.githubBranch || "master";
  if( cocodojo.githubRepo=== undefined || cocodojo.githubRepo != githubRepo ){
    cocodojo.githubRepo = githubRepo;
    $(document).trigger("repoSelected", {owner: githubHost, name: githubRepo, branch: githubBranch  });
    if(cocodojo.folderlist === undefined) 
      cocodojo.folderlist = new FolderList( githubHost, githubRepo, githubBranch, $("#ex-tree"));
    $('#repoTree').modal('hide');
  }
  cocodojo.codeSessionHost = fields.codeSessionHost;
};

$(document).on("repoSelectedByHost", function(evt, data) {
  $("#ex-tree").addClass("hide");
  $(".loading").removeClass("hide");
  if(cocodojo.folderlist === undefined) 
    cocodojo.folderlist = new FolderList( data.owner, data.name, data.branch, $("#ex-tree"));
  Meteor.call("initGithubFolderList", Session.get("codeSessionId"), function(){
    $("#ex-tree").removeClass("hide");
    $(".loading").addClass("hide");
  });
});

Template.repoview.rendered = function() {
  CodeSession.find({_id: Session.get("codeSessionId")}).observeChanges({
    added: function(id, fields){
      setGithubFileTree(fields);
      console.log(fields);
      if (fields.githubRepo) {
        $(".repo-name-branch").text("Repo Name: " + fields.githubRepo + " @ "+ fields.githubBranch);
        $(".repo-host").text("Hosted by: " + fields.githubHost);
      }
    },
    changed:function (id, fields){
      setGithubFileTree(fields);
      $(".repo-name-branch").text("Repo Name: " + fields.githubRepo + " @ "+ fields.githubBranch);
      $(".repo-host").text("Hosted by: " + fields.githubHost);
    }
  });
  FileFolder.find({codeSessionId: Session.get("codeSessionId")}).observeChanges({
    added: function(id, itemObj) {
      cocodojo.folderlist.addToFolderList(itemObj);
    },
    changed: function(id, fields) {
    	$("#" + id).remove();
    	console.log("changed", id);
		},
    removed: function(id) {
    	$("#"+id).remove();
		}
  });

  $.contextMenu({
    selector: '.tree',
    items: {
      "add": {
        name: "Add File",
        callback: function() {
          var fileName = window.prompt("Please input the name of the file");
          if (fileName) {
            $(document).trigger("addFile", {path: fileName, name: fileName});
          }
        }
      },
      "add-folder": {
        name: "Add Folder", 
        callback: function() {
          var folderName = window.prompt("Please input the name of the folder");
          if (folderName) {
            $(document).trigger("addFolder", {path: folderName, name: folderName});
          }
        }
      }
    }
  });
};
