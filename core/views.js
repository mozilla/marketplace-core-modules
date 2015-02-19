define('core/views',
    ['core/builder', 'core/defer', 'core/log', 'core/router', 'core/utils',
     'core/views/not_found', 'core/z', 'underscore'],
    function(builder, defer, log, router, utils, not_found, z, _) {
    var console = log('views');
    var not_found_loaded = defer.Deferred().resolve(not_found);

    function match_route(url) {
        // Returns a 2-tuple: (view, [args]) or null

        var hashpos, qspos;
        // Strip the hash string
        if ((hashpos = url.indexOf('#')) >= 0) {
            url = url.substr(0, hashpos);
        }

        // Strip the query string
        if ((qspos = url.indexOf('?')) >= 0) {
            url = url.substr(0, qspos);
        }

        // Force a leading slash
        if (url[0] != '/') {
            url = '/' + url;
        }

        // Strip trailing slash
        if (url !== '/' && url[url.length - 1] === '/') {
            url = url.substring(0, url.length - 1);
        }

        console.log('Routing', url);
        for (var i in router.routes) {
            var route = router.routes[i];
            if (route === undefined) continue;

            var matches = route.regexp.exec(url);
            if (!matches)
                continue;

            try {
                return [route.view(), _.rest(matches)];
            } catch (e) {
                console.error('Route matched but view not initialized!', e);
                return null;
            }

        }

        console.warn('Failed to match route for ' + url);
        return [not_found_loaded, null];
    }

    var last_args;
    function build(view, args, params) {
        last_args = arguments;  // Save the arguments in case we reload.

        var bobj = builder.getBuilder();
        view(bobj, args, utils.getVars(), params);

        // If there were no requests, the page is ready immediately.
        bobj.finish();

        return bobj;
    }

    function reload() {
        z.win.trigger('unloading');
        console.log('Reloading current view');
        return build.apply(this, last_args);
    }

    return {
        build: build,
        match: match_route,
        reload: reload,
    };

});
