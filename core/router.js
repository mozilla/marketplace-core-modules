define('core/router', [
    'core/utils',
    'underscore',
], function(utils, _) {
    var apiProcessors = [];
    var coreRegex = /^core\//;
    var exports = {
        addRoute: function(route) {
            var module;
            if (coreRegex.test(route.view_name)) {
                module = route.view_name.replace(coreRegex, 'core/views/');
            } else {
                module = 'views/' + route.view_name;
            }
            route.view = require(module);
            route.regexp = new RegExp(route.pattern);
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

    return exports;
});
