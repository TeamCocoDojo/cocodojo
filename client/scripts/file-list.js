var FolderList = function (owner, repoName, branch, element) {
	this.branch = branch;
	this.owner = owner;
	this.repoName = repoName;
	this.element = element;
	this.folders = {};
	element.empty();
	setTimeout("cocodojo.folderlist.getFolderList({})", 1000);
}
FolderList.prototype.getRepo = function(){
	var githubObj = cocodojo.getGithubObj();
	return githubObj.getRepo(this.owner, this.repoName);
}
FolderList.prototype.getContent = function (sha, callback) {

	this.getRepo().getBlob(sha, callback);
};

FolderList.prototype.addToFolderList = function ( fileName, path) {
	var pathes = path.split("/");
	var targetFolder = this.element;
	for(var i=0; i< pathes.length-1; i++){
		targetFolder = $(_.filter(targetFolder.children(".tree-folder"), function(item) {
			return $($($(item).children(".tree-folder-header")[0]).children(".tree-folder-name")[0]).text() == pathes[i];
		})[0]).children(".tree-folder-content");
	}
	
	var includeItem = cocodojo.folderlist.createFileItem({path: path, name: fileName });
	targetFolder.append(includeItem);
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
	element.click(function(evt){
		var selectedItem = $(this).data();
		me.getContent(selectedItem.sha, function(err, data){
			$(document).trigger("repoFileSelected", {owner: me.owner, repo: me.repoName ,name: selectedItem.name, sha:selectedItem.sha, content: data, path:selectedItem.path});
		});
	});
	return element;
};

FolderList.prototype.createFolderList = function (options) {
	var me = this;
	options.element.empty();

	for (var i = 0; i< options.data.length; i++){
		var data = options.data[i];
		if(data.type == 'folder'){
			var element = this.createFolderItem(data);
		}
		else{
			var element = this.createFileItem(data);
		}
		element.appendTo(options.element);
		element.data(data);
		$.contextMenu({
			selector: '.tree-folder-header',
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
		}
								 );
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
								 }
															);
	}
};
FolderList.prototype.getFolderList =  function (options, callback) {
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

	var self = this;
	var sha = options.sha || this.branch;
	var element = options.element || this.element;
	options.path = options.path || "";
	this.getRepo().getTree(sha, function(err, tree){
		var data = tree.map(function(item){
			currentFolder[item.name] = {};
			return {
				path: options.path + item.path + ((item.type == "blob")?"":"/"),
				name: item.path,
				sha: item.sha,
				type: (item.type == "blob")?"item":"folder"
			};
		});
		self.createFolderList({ data: data, element: element, start: 0, end: 0, count: 0, pages: 0, page: 0 });
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

function setGithubFileTree(fields){
	if(fields.githubRepo === undefined) return;
	var githubRepo = fields.githubRepo;
	var githubHost = fields.githubHost || cocodojo.codeSessionHost || "";
	var githubBranch = fields.githubBranch || cocodojo.githubBranch || "master";
	if( cocodojo.githubRepo=== undefined || cocodojo.githubRepo != githubRepo ){
		cocodojo.githubRepo = githubRepo;
		$(document).trigger("repoSelected", {owner: githubHost, name: githubRepo, branch: githubBranch  });
		cocodojo.folderlist = new FolderList( githubHost, githubRepo, githubBranch, $("#ex-tree"));
		$('#repoTree').modal('hide');
	}
	cocodojo.codeSessionHost = fields.codeSessionHost;
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
	FileFolder.find({codeSessionId: Session.get("codeSessionId")}).observeChanges({
		added: function(id, itemObj) {
			console.log(itemObj);
			cocodojo.folderlist.addToFolderList(itemObj.name, itemObj.path);
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
			}
		}
	});
};
