var repo = null;
var commitIndex = 0 ;
function commitFile(path, fileContent, callback){
  repo.postBlob(fileContent, function(err, sha){
    callback(err, {sha: sha, path: path});
  });
}
function commitFail(err){
	$("commitFailReason").text(err);
	$('#commitBox').modal('hide');
	$('#commitFail').modal('show');
}

$(document).on("repoSelected", function(e, repoInfo){
	cocodojo.repoHost = repoInfo.owner;
	$(document).trigger("updateGithubInfo", repoInfo);
	$("#branch-name").text(repoInfo.branch);
	repo = cocodojo.githubObj.getRepo(repoInfo.owner, repoInfo.name); 
	$("#commitConfirm").removeAttr("disabled");

	$("#commitConfirm").click(function(){
		var targetBranch = $('#optionNewBranch').is(':checked')?$("#new-branch-name").val():repoInfo.branch;
		var currentBranch = repoInfo.branch;
		$(document).trigger("commitToGit").on("ReceiveEditorContent", function(data){
			var docs = data.files;
			var message = $("#commitMessage").val();
			repo.getRef("heads/" + currentBranch, function(err, latestCommit){
				if (err) return commitFail(err);
				if(currentBranch != targetBranch){
					repo.createRef({
						ref: "refs/heads/" + targetBranch, 
						sha: latestCommit
					}, function(err, refInfo){
						if(err) return commitFail(err);
						var sha = refInfo.object.sha;
						commitMultipleFiles(repo, docs, sha, targetBranch, message);
					});	
				}
				else{
					commitMultipleFiles(repo, docs, latestCommit, targetBranch, message);
				}
			});
		});
	});
});

function commitMultipleFiles(repo, docs, refHash, targetBranch, message){
	var tree = [];
	var commitIndex = 0;
	docs.forEach(function(doc){
		commitFile(doc.path, doc.content, function(err, item){
			commitIndex += 1;
			if(err) return commitFail(err);

			tree.push({
				"path": item.path,
				"mode": "100644",
				"type": "blob",
				"sha": item.sha
			});
			if(commitIndex == docs.length){
				commit(repo, refHash, tree, targetBranch, message);
			}
		});
	});
};
function commit(repo, refHash, tree, targetBranch, message){
	repo.updateTree(refHash, tree, function(err, treeSha){
		if(err) return commitFail(err);
		repo.commit(refHash, treeSha, message, function(err, commit) {
			if(err) return commitFail(err);

			repo.updateHead(targetBranch, commit, function(err){
				if(err) return commitFail(err);

				$('#commitBox').modal('hide');
				$('#commitSuccess').modal('show');
			});
		});
	});
}
