var commitIndex = 0 ;
var docs = null;
var currentBranch = null;
var targetBranch = null;
function commitFail(err){
  $("commitFailReason").text(err);
  $('#commitBox').modal('hide');
  $('#commitFail').modal('show');
}


Template.commitBox.rendered = function() {
  $('#commitBox').on('show', function () {
    $("#commitBox .loading").removeClass("hide");
    $(document).on("doneCommit", function() {
      docs = $.map(FileTab.find({codeSessionId: Session.get("codeSessionId")}).fetch(), function(file){
        if(file.file.path === undefined) return null;
        return {path: file.file.path, content: file.file.content };
      });
      $(".loading").addClass("hide");
      $("#files-commited").empty();
      docs.forEach(function(doc){
        $("<li/>").text("Modified: " + doc.path).appendTo("#files-commited");
      });
      folders = FileFolder.find({codeSessionId: Session.get("codeSessionId"), type: "folder", status: "new"}).fetch();
      folders.forEach(function(doc){
        $("<li/>").text("Added: " + doc.path).appendTo("#files-commited");
      });
      deletedFiles = FileFolder.find({codeSessionId: Session.get("codeSessionId"), status: "removed"}).fetch();
      deletedFiles.forEach(function(doc){
        $("<li/>").text("Deleted: " +doc.path).appendTo("#files-commited");
      });
      $("#commitConfirm").removeAttr("disabled");
    });
  });
}

$(document).on("repoSelected", function(e, repoInfo){
  $(document).trigger("updateGithubInfo", repoInfo);
  cocodojo.repoOwner = repoInfo.owner;
  cocodojo.repoName = repoInfo.name;
  currentBranch = repoInfo.branch;

  var sessionSocket = io.connect(document.location.hostname + "/sesssion" + Session.get("codeSessionId"), {port: 3333});
    $(document).on("commitToGit", function() {
      console.log("Commit to git o");
      sessionSocket.emit("commit");
      ChangeLog.insert({
        codeSessionId: Session.get("codeSessionId"),
      });
    });
        
    $(document).on("doneSingleCommit", function() {
      sessionSocket.emit("finishCommit");
    });
        
    sessionSocket.on("doneCommit", function() {
      $(document).trigger("doneCommit");
    });

  $("#branch-name").text(repoInfo.branch);

  $("#btnCommitBox").click(function() {
    $(document).trigger("commitToGit");
  });

  $("#commitConfirm").click(function(){
    var targetBranch = $('#optionNewBranch').is(':checked') ? $("#new-branch-name").val() : repoInfo.branch;
    var repo = cocodojo.getGithubObj().getRepo(cocodojo.repoOwner, cocodojo.repoName);
    var message = $("#commitMessage").val();
    $(document).trigger("commitConfirm"); 
    repo.getRef("heads/" + currentBranch, function(err, latestCommit){
      if (err) return commitFail(err);
      if (currentBranch != targetBranch) {
        repo.createRef({
          ref: "refs/heads/" + targetBranch, 
          sha: latestCommit
        }, function(err, refInfo){
          if(err) return commitFail(err);
          var sha = refInfo.object.sha;
          commitMultipleFiles(repo, folders, deletedFiles, docs, sha, targetBranch, message);
        }); 
      }
      else {
        commitMultipleFiles(repo, folders, deletedFiles, docs, latestCommit, targetBranch, message);
      }
    });
  });
});
function commitMultipleFiles(repo, folders, deletedFiles, docs, refHash, targetBranch, message){
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
        if(deletedFiles.length > 0 ){
          removeDeletedFilesFromTree(deletedFiles, repo, refHash, tree, targetBranch, message);
        }
        else{
          commit(repo, refHash, tree, targetBranch, message);
        }
      }
    });
  });
};

function removeDeletedFilesFromTree(deletedFiles, repo, refHash, treeToModify, targetBranch, message) {
  var modifyList = _.map(treeToModify, function(item) {return item.path}); 
  repo.getTree(refHash+"?recursive=true", function(err, tree) {
    var newTree = _.reject(tree, function(ref) { return (deletedFiles.indexOf(ref.path) !== -1); });
    for(var i=0; i< newTree.length; i++) {
      var item = newTree[i];
      var index = modifyList.indexOf(item.path);
      if( index !== -1 ) {
        newTree[i] = treeToModify[index];
      }
      if (item.type === "tree") delete item.sha;
    }
    commit(repo, refHash, newTree, targetBranch, message);

  });

};

function commitFile(path, fileContent, callback) {
  cocodojo.getGithubObj().getRepo(cocodojo.repoOwner, cocodojo.repoName).postBlob(fileContent, function(err, sha){
    callback(err, {sha: sha, path: path});
  });
};

function commit(repo, refHash, tree, targetBranch, message) {
  repo.updateTree(refHash, tree, function(err, treeSha){
    if(err) return commitFail(err);
    repo.commit(refHash, treeSha, message, function(err, commit) {
      if(err) return commitFail(err);

      repo.updateHead(targetBranch, commit, function(err){
        if(err) {
          return commitFail(err);
        }
        $('#commitBox').modal('hide');
        $('#commitSuccess').modal('show');
      });
    });
  });
}
