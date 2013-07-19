Template.repoTree.rendered = function() {
	$('#repoTree').on('show', function () {
	});
}

function createBranchList(repoOwner, repoName){
	var repo = cocodojo.githubObj.getRepo(repoOwner, repoName);
	repo.listBranches(function(err, branches) {
		var ul = $("#branch-list");
		branches.forEach( function(branch) {
			var li = $("<li/>");
			var a = $("<a/>");
			a.text(branch);
			a.attr("data-branch", branch);
			ul.append(li);
			li.append(a);
		});
		ul.find("a").click(function(){
			var branchName = $(this).attr("data-branch");
			CodeSession.update({_id: Session.get("codeSessionId")}, {githubHost: repoOwner, githubRepo: repoName, githubBranch: branchName});
		});
	});
};

$(document).on("githubObjectCreated", function(){
	var user = cocodojo.githubObj.getUser();
	user.repos(function(err, repos) {
		var ul = $("#repo-list");
		ul.empty();
		repos.forEach(function(repo) {
			var li = $("<li/>");
			var a = $("<a/>");
			a.text(repo.full_name);
			a.attr("data-name", repo.name);
			a.attr("data-owner", repo.owner.login);
			ul.append(li);
			li.append(a);
		});
		ul.find("a").click(function() {
			var repoName = $(this).attr("data-name");
			var repoOwner = $(this).attr("data-owner");
			$(".select-repo").addClass("hide");
			$(".select-branch").removeClass("hide");
			createBranchList(repoOwner, repoName);
		});
	});
});
