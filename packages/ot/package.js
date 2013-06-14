Package.describe({
        summary: 'ot, Collaborative editing using operational transformation'
});

Npm.depends({ot: '0.0.12'});

Package.on_use(function(api) {
        api.add_files('ot-sdk.js', 'server');
});
