/*
    Register routes for the app. This module maintains view routes, API routes
    and API args processors.

    To register the view routes:

      router.addRoutes([
        {pattern: '^/path/for/route$', view_name: 'my_view'},
        // more routes...
      ]);

    To register API routes:

      router.api.addRoutes({
        'products': '/products',
        'product': '/product/{0}',
        // more routes...
      });

    To register API args processors:

      router.api.addProcessor(function(endpoint) {
        if (endpoint === 'product') {
          return {extra_arg: 'the-value'};
        }
      });
*/
define('core/router',
    ['core/defer', 'core/utils', 'underscore'],
    function(defer, utils, _) {

    var apiProcessors = [];
    var coreRegex = /^core\//;
    var exports = {
        addRoute: function(route) {
            var viewRequired = false;
            var viewLoaded = defer.Deferred();
            var viewModule;
            if (coreRegex.test(route.view_name)) {
                viewModule = route.view_name.replace(coreRegex, 'core/views/');
            } else {
                viewModule = 'views/' + route.view_name;
            }
            route.view = function() {
                if (!viewRequired) {
                    viewRequired = true;
                    require([viewModule], function(view) {
                        viewLoaded.resolve(view);
                    });
                }
                return viewLoaded.promise();
            };
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
