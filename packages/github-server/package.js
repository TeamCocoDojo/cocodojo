Package.describe({

	summary: "github"
})

Npm.depends({github: "0.1.8"});

Package.on_use(function(api) {
	api.add_files('github-server.js', 'server');
});
