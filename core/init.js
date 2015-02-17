define('core/init',
    ['core/defer', 'core/router', 'core/utils'],
    function(defer, router, utils) {

    router.api.addRoutes({
        'fxa-login': '/api/v2/account/fxa-login/',
        'login': '/api/v2/account/login/',
        'logout': '/api/v2/account/logout/',
        'site-config': '/api/v2/services/config/site/?serializer=commonplace',
    });

    router.api.addProcessor(function(endpoint) {
        return {lang: utils.lang()};
    });

    var done = defer.Deferred();
    require(['core/views/fxa_authorize'], function() {
        router.addRoutes([
            {'pattern': '^/fxa-authorize$', 'view_name': 'core/fxa_authorize'},
        ]);
        done.resolve();
    });

    return {ready: done.promise()};
});
