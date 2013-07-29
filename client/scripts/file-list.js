var FolderList = function (owner, repoName, branch, element) {
	this.branch = branch;
	this.owner = owner;
	this.repoName = repoName;
	this.element = element;
	this.folders = {};
	element.empty();
	//setTimeout("cocodojo.folderlist.initFolderList({})", 1000);
}
FolderList.prototype.getRepo = function(){
	var githubObj = cocodojo.getGithubObj();
	return githubObj.getRepo(this.owner, this.repoName);
}
FolderList.prototype.getContent = function (sha, callback) {
	this.getRepo().getBlob(sha, callback);
};

FolderList.prototype.addToFolderList = function ( data ) {
	console.log(data);
	var pathes = data.path.split("/");
	var targetFolder = this.element;
	for(var i=0; i< pathes.length-1; i++){
		targetFolder = $(_.filter(targetFolder.children(".tree-folder"), function(item) {
			return $($($(item).children(".tree-folder-header")[0]).children(".tree-folder-name")[0]).text() == pathes[i];
		})[0]).children(".tree-folder-content");
	}
	if(data.type == "file") 
		var includeItem = cocodojo.folderlist.createFileItem(data);
	else
		var includeItem = cocodojo.folderlist.createFolderItem(data)
	
	targetFolder.append(includeItem);
	$.contextMenu({
		selector: '.tree-item',
		items: {
			"rename": {
				name: "Rename File",
				callback: function() {
					var fileName = window.prompt("Please input the name of the file");
					if (fileName) {
						var fullPath = $(this).data("path") + fileName
						$(document).trigger("renameFile", fullPath);
					}
				}
			},
			"delete": {
				name: "Delete File",
				callback: function() {
					$(document).trigger("deleteFile", fullPath);
				}
			}
		}
	});
	$.contextMenu({
		selector: '.tree-folder',
		items: {
			"add": {
				name: "Add File",
				callback: function() {
					var fileName = window.prompt("Please input the name of the file");
					if (fileName) {
						var fullPath = $(this).data("path") + fileName
						$(document).trigger("addFile", {path: fullPath, name: fileName});
					}
				}
			},
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
				callback: function() {
					$(document).trigger("deleteFile", fullPath);
				}
			}
		}
	});
}

FolderList.prototype.createFolderItem = function ( data ) {
	var me = this;
	var header = $("<div/>").addClass('tree-folder-header').append("<i class='icon-folder-close'></i>").append("<div class='tree-folder-name'>" + data.name + "</div>");
	var content = $("<div/>").addClass('tree-folder-content').hide();
	var element = $("<div/>").addClass('tree-folder');
	header.attr("data-path", data.path);
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
		me.getContent(selectedItem.sha, function(err, data){
			$(document).trigger("repoFileSelected", {owner: me.owner, repo: me.repoName ,name: selectedItem.name, sha:selectedItem.sha, content: data, path:selectedItem.path});
		});
	});
	return element;
};
FolderList.prototype.initFolderList =  function (callback) {
	var me = this;
	var sha = this.branch;
	this.folders = {};
	this.getRepo().getTree(sha + "?recursive=true", function(err, tree){
		tree.sort(function(a, b){
			return a.path.localeCompare(b.path);
		});
		console.log("start foreach", tree);
		_.each(tree, function(item){
			var pathes = item.path.split("/");
			var folder = me.folders;
			
			for(var j=0; j< pathes.length-1; j++){
				folder = folder[pathes[j]].subcontents;
			}
			
			if(item.type == "tree") item.subcontents = {};
			folder[pathes[pathes.length-1]] = item;
			console.log("insert item", item);
			FileFolder.insert({
				codeSessionId: Session.get("codeSessionId"),
				type: (item.type=="blob") ? "file" : "folder",
				path: item.path, 
				name: pathes[pathes.length-1],
				sha: item.sha
			});

		}, this);
		$(".loading").addClass("hide");
		$("#ex-tree").removeClass("hide");
	});	
}

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

$(document).on("addFile", function(evt, data) {
	var fileName = data.name;
	var filePath = data.path;
	FileFolder.insert({
		codeSessionId: Session.get("codeSessionId"),
		type: "file",
		path: data.path, 
		name: data.name
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
	cocodojo.folderlist.initFolderList();
});

Template.repoview.rendered = function() {
	CodeSession.find({_id: Session.get("codeSessionId")}).observeChanges({
		added: function(id, fields){
			setGithubFileTree(fields);
		},
		changed:function (id, fields){
			setGithubFileTree(fields);
		}
	});
	FileFolder.find({codeSessionId: Session.get("codeSessionId")}).observeChanges({
		added: function(id, itemObj) {
			console.log("added", id);
			cocodojo.folderlist.addToFolderList(itemObj);
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
