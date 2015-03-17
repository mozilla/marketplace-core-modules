/*
    Bootstraps the framework. Projects should consume this module and wait for
    the exposed promise to resolve before doing anything else.

    helpers -- sets up Nunjucks globals, helpers, filters.
    l10n_init -- loads locale script, sets up w.nav.l10n.
    navigation -- sets up navigation event handlers.
    polyfill -- sets up browser polyfills.

    Also configures some things to bootstrap the framework.

    - Adds base routes such as login.
    - Makes ?lang parameter is sent out with each XHR.
*/
define('core/init',
    ['core/helpers', 'core/l10n_init', 'core/navigation', 'core/polyfill',
     'core/router', 'core/utils'],
    function(helpers, l10n_init, navigation, polyfill,
             router, utils) {

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

    return {
        ready: l10n_init.injectLocaleScript()
    };
});
