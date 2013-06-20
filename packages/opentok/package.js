Package.describe({
        summary: 'opentok, face-to-face multi-part video api'
});

Npm.depends({"opentok" : "0.3.0"});

Package.on_use(function(api) {
        api.add_files('opentok-sdk.js', 'server');
});