$(document).on("repoSelected", function(e, repoInfo){

  var repo = cocodojo.githubObj.getRepo(repoInfo.owner, repoInfo.name);
  repo.listBranches(function(err, branches) {
      $("#branch").append("<option>New Branch</option>");
    $.each(branches, function(item){
      $("#branch").append("<option>" + branches[item] + "</option>" ); 
    });
  });
  $("#commitConfirm").removeAttr("disabled");


  $("#commitConfirm").click(function(){
    $(document).trigger("getEditorContent").on("ReceiveEditorContent", function(data){
      var content = data.content;
      var filePath = data.filePath;
      var message = $("#commitMessage").val();
      var branch = $("#branch").val();
      repo.write(branch, filePath, content, message, function(err) {
        if(err) return console.log("failed");
        $('#commitBox').modal('hide');
      });
    });
  });
});
