define('core/init',
    ['settings_app', 'routes'],
    function() {

    require(['core/helpers', 'core/navigation', 'core/polyfill', 'core/router',
             'core/settings', 'core/utils'],
        function(helpers, navigation, polyfill, router,
                 settings, utils) {

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

        require([settings.init_module], function() {});
    });
});
