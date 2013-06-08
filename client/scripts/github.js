
Meteor.loginWithGithub({
  requestPermissions: {
    github: ['user', 'public_repo']
  },
  requestOfflineToken: {
    github: true
  }
});


var cocodojo = cocodojo || {};

cocodojo.githubAPI = cocodojo.githubAPI || {};

cocodojo.githubAPI.getAccessToken = function() {
  if (Meteor.user()) {
    var user = Meteor.user();
    return user.services.github.accessToken;
  }
};

cocodojo.githubAPI.getUsername = function() {
  if (Meteor.user()) {
    var user = Meteor.user();
    return user.services.github.username;
  }
};

cocodojo.githubAPI.getRepos = function(callback) {
  var accessToken = cocodojo.githubAPI.getAccessToken();
  if (accessToken) {
    Meteor.http.get("https://api.github.com/user/repos?access_token=" + accessToken,
      function (error, result) {
        if (result.statusCode === 200) {
          callback(result);
        }
      }
    );
  }
};

cocodojo.githubAPI.getFiles = function() {

};

cocodojo.githubRepo = function(repo) {
  return this;
};

cocodojo.githubRepo.prototype = {

  getFiles: function() {

  },

  getBranches: function() {

  }
};

cocodojo.githubFile = function(file) {
  return this;
};

cocodojo.githubFile.prototype = {

  getContent: function() {

  },

  getType: function() {

  },

  getChildren: function() {

  },

  updateFile: function(content) {

  },

  deleteFile: function() {

  }

};


Template.repoview.userName = function() {
  return cocodojo.githubAPI.getUsername();
};

Template.repoview.events({
  'click input' : function () {
    cocodojo.githubAPI.getRepos();
  }
});

Template.repoview.rendered = function() {

  cocodojo.githubAPI.getRepos(function(repos) {
    var allRepo = [];
    for (var i = 0; i < repos.data.length; i++) {
        var repo = {
          name: repos.data[i].name,
          type: "folder",
        };
        allRepo.push(repo);
    }
    var dataSourceTree = new TreeDataSource({
      data: allRepo,
      delay: 400
    });

    $('#ex-tree').tree({
      dataSource: dataSourceTree,
      loadingHTML: '<div class="static-loader">Loading...</div>',
      multiSelect: true,
      cacheItems: true
    });
  });
};

