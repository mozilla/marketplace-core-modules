define('router', [
    'underscore',
    'utils',
    'views/fxa_authorize',
], function(_, utils) {
    var apiProcessors = [];
    var exports = {
        addRoute: function(route) {
            route.view = require('views/' + route.view_name);
            exports.routes.push(route);
        },
        addRoutes: function(routes) {
            for (var i = 0; i < routes.length; i++) {
                exports.addRoute(routes[i]);
            }
        },
        clearRoutes: function() {
            exports.routes = [];
        },
        routes: [],
        api: {
            addProcessor: function(processor) {
                apiProcessors.push(processor);
            },
            clearProcessors: function() {
                apiProcessors = [];
            },
            args: function(endpoint) {
                return _.reduce(apiProcessors, function(memo, processor) {
                    return _.extend(memo, processor(endpoint));
                }, {});
            },
            addRoutes: function(routes) {
                _.extend(exports.api.routes, routes);
            },
            clearRoutes: function() {
                exports.api.routes = {};
            },
            routes: {},
        },
    };

    exports.addRoutes([
        {'pattern': '^/fxa-authorize$', 'view_name': 'fxa_authorize'},
    ]);

    exports.api.addRoutes({
        'fxa-login': '/api/v2/account/fxa-login/',
        'login': '/api/v2/account/login/',
        'logout': '/api/v2/account/logout/',
        'site-config': '/api/v2/services/config/site/?serializer=commonplace',
    });

    exports.api.addProcessor(function(endpoint) {
        return {lang: utils.lang()};
    });

    return exports;
});
