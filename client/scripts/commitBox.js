var repo = null;
var commitIndex = 0 ;
function commitFile(path, fileContent, callback){
  repo.postBlob(fileContent, function(err, sha){
    callback(err, {sha: sha, path: path});
  });
}
$(document).on("repoSelected", function(e, repoInfo){

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
      console.log(docs);
      var branch = $("#branch").val();
      var message = $("#commitMessage").val();
      console.log(branch);
      repo.getRef("heads/" + branch, function(err, latestCommit){
        if (err) {
          console.log(err);
          return ;
        }
        var tree = [];
        docs.forEach(function(doc){
          commitFile(doc.path, doc.content, function(err, item){
            commitIndex += 1;
            if(err) {
              console.log(err);
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
                  console.log(err);
                  return;
                }
                console.log("tree sha: " + treeSha);
                repo.commit(latestCommit, treeSha, message, function(err, commit) {
                  if(err) {
                    console.log(err);
                    return;
                  }
                  repo.updateHead(branch, commit, function(err){
                    if(err){
                      console.log(err);
                      return; 
                    }
                     $('#commitBox').modal('hide');
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
