/*
    Get Zamboni site configuration data, including waffle switches and FXA
    info.
*/
define('core/site_config',
    ['core/defer', 'core/polyfill', 'core/requests', 'core/settings',
     'core/utils', 'core/urls', 'core/z', 'underscore'],
    function(defer, polyfill, requests, settings, utils, urls, z, _) {

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
                settings.fxa_auth_url = update_fxa_url_client_id(data.fxa.fxa_auth_url);
                settings.fxa_auth_state = data.fxa.fxa_auth_state;
            }
            if (data.waffle && data.waffle.switches && _.isArray(data.waffle.switches)) {
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
        'http://localhost:8675': '124ae9dff020ba79',
        // marketplace-comm-dashboard.
        'http://localhost:8676': '31b549f7dfb4de69',
        // marketplace-stats.
        'http://localhost:8677': 'cc389d4ccd6cd34d',
        // marketplace-editorial-tools.
        'http://localhost:8678': '47354b86fb361c7e',
        // marketplace-operator-dashboard.
        'http://localhost:8679': '049d4b105daa1cb9',
    };

    function update_fxa_url_client_id(fxa_auth_url, origin) {
        // If developing locally, replaces the client_id in fxa_auth_url so
        // the server knows where to redirect to (bug 1093338). Allows for
        // local development with FxA.
        var client_id = fxa_client_id_for_origin(origin);
        if (client_id) {
            return utils.urlparams(fxa_auth_url, {
                client_id: client_id
            });
        } else {
            return fxa_auth_url;
        }
    }

    function fxa_client_id_for_origin(origin) {
        // Lookup a client_id based on our hostname -> client_id mapping. This
        // is used to handle the fact that FxA only allows one redirect URL
        // per client_id so a different client_id is needed for each hostname.
        return fxa_client_ids[origin || window.location.origin];
    }

    return {
        fetch: fetch,
        fxa_client_id_for_origin: fxa_client_id_for_origin,
        promise: fetch(),
        update_fxa_url_client_id: update_fxa_url_client_id
    };
});
