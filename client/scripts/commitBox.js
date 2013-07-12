var repo = null;
var commitIndex = 0 ;
function commitFile(path, fileContent, callback){
  repo.postBlob(fileContent, function(err, sha){
    callback(err, {sha: sha, path: path});
  });
}
$(document).on("repoSelected", function(e, repoInfo){
  $(document).trigger("updateGithubInfo", repoInfo);
  repo = cocodojo.githubObj.getRepo(repoInfo.owner, repoInfo.name);
  repo.listBranches(function(err, branches) {
    //$("#branch").append("<option>New Branch</option>");
    $.each(branches, function(item){
      $("#branch").append("<option>" + branches[item] + "</option>" ); 
    });
  });
  $("#commitConfirm").removeAttr("disabled");

  $("#commitConfirm").click(function(){
    $(document).trigger("commitToGit").on("ReceiveEditorContent", function(data){
      var docs = data.files;
      var branch = $("#branch").val();
      var message = $("#commitMessage").val();
      repo.getRef("heads/" + branch, function(err, latestCommit){
        if (err) {
          $("commitFailReason").text(err);
          $('#commitBox').modal('hide');
          $('#commitFail').modal('show');
          return ;
        }
        var tree = [];
        docs.forEach(function(doc){
          commitFile(doc.path, doc.content, function(err, item){
            commitIndex += 1;
            if(err) {
              $("commitFailReason").text(err);
              $('#commitBox').modal('hide');
              $('#commitFail').modal('show');
              return ;
            }
            tree.push({
              "path": item.path,
              "mode": "100644",
              "type": "blob",
              "sha": item.sha
            });
            if(commitIndex == docs.length){
              repo.updateTree(latestCommit, tree, function(err, treeSha){
                if(err){
                    $("commitFailReason").text(err);
                    $('#commitBox').modal('hide');
                    $('#commitFail').modal('show');
                  return;
                }
                repo.commit(latestCommit, treeSha, message, function(err, commit) {
                  if(err) {
                    $("commitFailReason").text(err);
                    $('#commitBox').modal('hide');
                    $('#commitFail').modal('show');
                    return;
                  }
                  repo.updateHead(branch, commit, function(err){
                    if(err){
                      $("commitFailReason").text(err);
                      $('#commitBox').modal('hide');
                      $('#commitFail').modal('show');
                      return; 
                    }
                    $('#commitBox').modal('hide');
                    $('#commitSuccess').modal('show');
                  });
                });

              });
            }
          });
        });
      });
    });
  });
});
