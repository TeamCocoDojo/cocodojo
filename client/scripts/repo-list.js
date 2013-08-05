Template.repoTree.rendered = function() {
	$('#repoTree').on('show', function () {
	});
	$("#btn-choose-repo").click(function (event) {
		event.preventDefault();
		$(".select-repo").removeClass("hide");
		$(".select-branch").addClass("hide");
	});
}
function createBranchList(repoOwner, repoName){
	cocodojo.codeSessionHost = cocodojo.githubUser.username; 
	var repo = cocodojo.getGithubObj().getRepo(repoOwner, repoName);
	repo.listBranches(function(err, branches) {
		var ul = $("#branch-list");
		ul.empty();
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
			CodeSession.update({_id: Session.get("codeSessionId")}, 
												 {codeSessionHost: cocodojo.githubUser.username, 
												 	 githubHost: repoOwner, 
												 	 githubRepo: repoName, 
												 	 githubBranch: branchName,
													 githubToken: cocodojo.githubUser.accessToken
												 });
			$(document).trigger("repoSelectedByHost", {owner: repoOwner, name: repoName, branch: branchName});
		});
	});
};

$(document).on("githubObjectCreated", function(){
	var user = cocodojo.getGithubObj().getUser();
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
