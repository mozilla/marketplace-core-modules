/*
    Get Zamboni site configuration data, including waffle switches and FXA
    info.
*/
define('site_config',
    ['defer', 'polyfill', 'requests', 'settings', 'underscore', 'utils', 'urls', 'z'],
    function(defer, polyfill, requests, settings, _, utils, urls, z) {

    function fetch() {
        var def = defer.Deferred();

        // Try looking in the body for data-settings and data-waffle-switches.
        // They are set by zamboni on the index.html it serves, and if they are
        // present, we can avoid making the API call entirely.
        var body_settings = z.body.data('settings');
        var body_waffle_switches = z.body.data('waffle-switches');
        if (body_settings &&
            body_settings.fxa_auth_url &&
            body_settings.fxa_auth_state &&
            _.isArray(body_waffle_switches)) {
            settings.fxa_auth_url = body_settings.fxa_auth_url;
            settings.fxa_auth_state = body_settings.fxa_auth_state;
            settings.switches = body_waffle_switches;
            return def.resolve().promise();
        }

        requests.get(urls.api.unsigned.url('site-config')).done(function(data) {
            if (data.hasOwnProperty('fxa')) {
                set_fxa_client_id(window.location.origin, data);
                settings.fxa_auth_url = data.fxa.fxa_auth_url;
                settings.fxa_auth_state = data.fxa.fxa_auth_state;
            }
            if (data.waffle.switches && _.isArray(data.waffle.switches)) {
                settings.switches = data.waffle.switches;
            }
            def.resolve(data);
        }).always(function() {
            def.resolve();
        });

        return def.promise();
    }

    var fxa_client_ids = {
        // marketplace-frontend.
        'http://localhost:8675': 'rxlfac6medc5jn6s',
        // marketplace-comm-dashboard.
        'http://localhost:8676': 'r67qywce0i8gbgq0',
        // marketplace-stats.
        'http://localhost:8677': 'vfs1ce0r8803oyxz',
        // marketplace-editorial-tools.
        'http://localhost:8678': 's1nh8891zmfusfds',
        // marketplace-operator-dashboard.
        'http://localhost:8679': 'sb08x7vb6jshd9x4',
    };

    function set_fxa_client_id(origin, site_data) {
        // If developing locally, replaces the client_id in fxa_auth_url so
        // the server knows where to redirect to (bug 1093338). Allows for
        // local development with FXA.
        if (fxa_client_ids[origin] && site_data.fxa_auth_url) {
            site_data.fxa_auth_url = utils.urlparams(site_data.fxa_auth_url, {
                client_id: fxa_client_ids[origin]
            });
        }
    }

    return {
        fetch: fetch,
        promise: fetch(),
        set_fxa_client_id: set_fxa_client_id
    };
});
