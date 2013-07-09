var repo = null;
var commitIndex = 0 ;
function commitFile(filePath, fileContent, callback){
  repo.postBlob(fileContent, function(err, sha){
    callback(err, {sha: sha, filePath: filePath});
  });
}
$(document).on("repoSelected", function(e, repoInfo){

  repo = cocodojo.githubObj.getRepo(repoInfo.owner, repoInfo.name);
  repo.listBranches(function(err, branches) {
    $("#branch").append("<option>New Branch</option>");
    $.each(branches, function(item){
      $("#branch").append("<option>" + branches[item] + "</option>" ); 
    });
  });
  $("#commitConfirm").removeAttr("disabled");

  $("#commitConfirm").click(function(){
    $(document).trigger("getEditorContent").on("ReceiveEditorContent", function(data){
      var docs = data.files;
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
          commitFile(doc.filePath, doc.content, function(err, item){
            commitIndex += 1;
            if(err) {
              console.log(err);
              return ;
            }
            tree.push({
              "path": item.filePath,
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
                    console.log("success:"+ commit);
                  });
                });

              });
            }
          });
        });
      });
      return; 

      var content = data.content;

      var filePath = data.filePath;
      repo.write(branch, filePath, content, message, function(err) {
        if(err) return console.log("failed");
        $('#commitBox').modal('hide');
      });
    });
  });
});
