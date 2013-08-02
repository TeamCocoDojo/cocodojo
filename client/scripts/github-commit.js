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
    Meteor.call("getGithubContent", Session.get("codeSessionId"), "", function(result) {
      console.log(arguments);
    });

    $(".loading").removeClass("hide");
    $(document).on("doneCommit", function() {
      docs = $.map(FileTab.find({codeSessionId: Session.get("codeSessionId")}).fetch(), function(file){
        if(file.file.path === undefined) return null;
        return {path: file.file.path, content: file.file.content };
      });
      $(".loading").addClass("hide");
      $("#files-commited").empty();
      docs.forEach(function(doc){
        $("<li/>").text(doc.path).appendTo("#files-commited");
      });
      docs.forEach(function(doc){
        $("<li/>").text(doc.path).appendTo("#files-commited");
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
    folders = FileFolder.find({codeSessionId: Session.get("codeSessionId"), type: "folder", status: "new"}).get();
    repo.getRef("heads/" + currentBranch, function(err, latestCommit){
      if (err) return commitFail(err);
      if (currentBranch != targetBranch) {
        repo.createRef({
          ref: "refs/heads/" + targetBranch, 
          sha: latestCommit
        }, function(err, refInfo){
          if(err) return commitFail(err);
          var sha = refInfo.object.sha;
          commitMultipleFiles(repo, folders, docs, sha, targetBranch, message);
        }); 
      }
      else {
        commitMultipleFiles(repo, folders, docs, latestCommit, targetBranch, message);
      }
    });
  });
});

function commitMultipleFiles(repo, folders, docs, refHash, targetBranch, message){
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
