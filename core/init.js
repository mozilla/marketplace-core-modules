/*
   init.js is appending to our minified bundles in the CP build process.
   Pulls in the settings.js module once it is available.
   Looks for settings.init_module which points to the module name of our
   main/initialization module.
   Invokes the main/initialization module once it is available to kick things
   off.
*/
define('core/init', [
    'core/router',
    'core/views/fxa_authorize',
], function(router) {
    router.addRoutes([
        {'pattern': '^/fxa-authorize$', 'view_name': 'core/fxa_authorize'},
    ]);

    router.api.addRoutes({
        'fxa-login': '/api/v2/account/fxa-login/',
        'login': '/api/v2/account/login/',
        'logout': '/api/v2/account/logout/',
        'site-config': '/api/v2/services/config/site/?serializer=commonplace',
    });

    router.api.addProcessor(function(endpoint) {
        return {lang: utils.lang()};
    });
});
