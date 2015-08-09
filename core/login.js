define('core/login',
    ['core/cache', 'core/capabilities', 'core/defer', 'core/log',
     'core/notification', 'core/polyfill', 'core/requests', 'core/settings',
     'core/site_config', 'core/storage', 'core/urls', 'core/user',
     'core/utils', 'core/views', 'core/z', 'jquery', 'underscore'],
    function(cache, capabilities, defer, log,
             notification, polyfill, requests, settings,
             siteConfig, storage, urls, user,
             utils, views, z, $, _) {

    var console = log('login');
    var fxa_popup;
    var retainPopup;
    var pending_logins = [];
    var packaged_origin = "app://" + window.location.host;
    function oncancel() {
        console.log('Login cancelled');
        z.page.trigger('login_cancel');
        _.invoke(pending_logins, 'reject');
        pending_logins = [];
    }

    function signOutNotification() {
        notification.notification({message: gettext('You have been signed out.')});
    }

    function signInNotification() {
        notification.notification({message: gettext('You have been signed in.')});
    }

    function logOut() {
        cache.flush_signed();
        var isLoggedIn = false;
        if (storage.getItem('user')) {
            isLoggedIn = true;
        }
        user.clear_token();

        z.body.removeClass('logged-in');
        z.page.trigger('reload_chrome').trigger('before_logout');
        if (!z.context.dont_reload_on_login) {
            z.page.trigger('logged_out');
            if (isLoggedIn) {
                signOutNotification();
            }
            views.reload();
        } else {
            console.log('Reload on logout aborted by current view');
        }
    }

    function logIn(data) {
        var should_reload = !user.logged_in();

        user.set_token(data.token, data.settings);
        user.update_permissions(data.permissions);
        user.update_apps(data.apps);
        console.log('Login succeeded, preparing the app');

        z.body.addClass('logged-in');
        $('.loading-submit').removeClass('loading-submit');
        z.page.trigger('reload_chrome').trigger('logged_in');

        function resolve_pending() {
            _.invoke(pending_logins, 'resolve');
            pending_logins = [];
        }

        if (should_reload && !z.context.dont_reload_on_login) {
            views.reload().done(function() {
                resolve_pending();
                signInNotification();
            });
        } else {
            console.log('Reload on login aborted by current view');
        }
    }

    function logInFailed(message) {
        message = message || gettext('Sign in failed');
        notification.notification({message: message});
        $('.loading-submit').removeClass('loading-submit');
        z.page.trigger('login_fail');
        _.invoke(pending_logins, 'reject');
        pending_logins = [];
    }

    z.body.on('click', '.persona', function(e) {
        e.preventDefault();

        var $this = $(this);
        $('.loading-submit').removeClass('loading-submit');
        $this.addClass('loading-submit');
        startLogin({register: $this.hasClass('register')}).always(function() {
            $this.removeClass('loading-submit').trigger('blur');
        });

    }).on('click', '.logout', utils._pd(function(e) {
        requests.del(urls.api.url('logout'));

        if (capabilities.fallbackFxA()) {
            logOut();
        }
    }));

    function startLogin(options) {
        var def = defer.Deferred();
        pending_logins.push(def);
        var opt = {register: false};
        // Override our settings with the provided ones.
        _.extend(opt, options);
        if (capabilities.yulelogFxA()) {
            window.top.postMessage({type: 'fxa-request'}, packaged_origin);
        } else if (capabilities.fallbackFxA()) {
            var fxa_url = fxa_redirect_url({register: opt.register});

            if (opt.popupWindow) {
                console.log('Changing location of supplied window to', fxa_url);
                fxa_popup = opt.popupWindow;
                fxa_popup.location = fxa_url;
                retainPopup = true;
            } else {
                console.log('Opening new login window');
                fxa_popup = utils.openWindow({url: fxa_url});
                retainPopup = false;

                // The same-origin policy prevents us from listening to events to
                // know when the cross-origin FxA popup was closed. And we can't
                // listen to `focus` on the main window because, unlike Chrome,
                // Firefox does not fire `focus` when a popup is closed (presumably
                // because the page never truly lost focus).
                var popup_interval = setInterval(function() {
                     if (!fxa_popup || fxa_popup.closed) {
                        // The oncancel was cancelling prematurely when window is closed,
                        // prevents review dialog from popping up on login success.
                        // oncancel();
                        $('.loading-submit').removeClass('loading-submit').trigger('blur');
                        clearInterval(popup_interval);
                    }
                }, 500);
            }

        } else {
            console.log('Requesting login from Native FxA');
            navigator.mozId.request({oncancel: oncancel});
        }
        return def.promise();
    }

    function gotVerifiedEmail(assertion) {
        console.log('Got assertion from FxA');
        var aud;
        if (capabilities.yulelogFxA()) {
            aud = packaged_origin;
        } else {
            aud = window.location.origin;
        }
        var data = {
            assertion: assertion,
            audience: aud,
        };

        z.page.trigger('before_login');

        requests.post(urls.api.url('login'), data)
                .done(logIn)
                .fail(function(jqXHR, textStatus, error) {
            console.warn('Assertion verification failed!', textStatus, error);

            var err = jqXHR.responseText;
            // Catch-all for XHR errors otherwise we'll trigger a notification
            // with its message as one of the error templates.
            if (jqXHR.status != 200) {
                err = gettext('FxA login failed. A server error was encountered.');
            }
            logInFailed(err);
        });
    }

    function startNativeFxA() {
        var email = user.get_setting('email') || '';
        if (email) {
            console.log('Detected user', email);
        } else {
            console.log('No previous user detected');
        }
        console.log('Calling navigator.mozId.watch');
        navigator.mozId.watch({
            wantIssuer: 'firefox-accounts',
            loggedInUser: email,
            // This lets us change the cursor for the "Sign in" link.
            onready: function() {z.body.addClass('persona-loaded');},
            onlogin: gotVerifiedEmail,
            onlogout: function() {
                z.body.removeClass('logged-in');
                z.page.trigger('reload_chrome').trigger('logout');
            }
        });
    }

    function registerFxAPostMessageHandler() {
        window.addEventListener('message', function (msg) {
            var valid_origins = [settings.api_url, window.location.origin];
            if (msg.data && msg.data.auth_code &&
                    valid_origins.indexOf(msg.origin) !== -1) {
                handle_fxa_login(msg.data.auth_code);
            }
        });
    }

    siteConfig.promise.done(function(data) {
        if (capabilities.yulelogFxA()) {
            console.log("setting up yulelog-fxa");
            window.addEventListener('message', function (msg) {
                if (!msg.data || !msg.data.type || msg.origin !== packaged_origin) {
                    return;
                }
                console.log("fxa message " + JSON.stringify(msg.data));
                if (msg.data.type === 'fxa-login') {
                    gotVerifiedEmail(msg.data.assertion);
                } else if (msg.data.type === 'fxa-logout') {
                    logOut();
                } else if (msg.data.type === 'fxa-cancel') {
                    oncancel();
                }
            });
            window.top.postMessage({type: 'fxa-watch',
                                    email: user.get_setting('email') || ''},
                                   packaged_origin);
        } else if (!capabilities.fallbackFxA()) {
            startNativeFxA();
        } else {
            // This lets us change the cursor for the "Sign in" link.
            z.body.addClass('persona-loaded');
            // Register the "message" handler here to avoid it being registered
            // multiple times.
            registerFxAPostMessageHandler();
        }
    });

    var fxa_auth_url_key = 'fxa_auth_url';
    function save_fxa_auth_url(url) {
        storage.setItem(fxa_auth_url_key, url);
    }

    function get_fxa_auth_url() {
        return storage.getItem(fxa_auth_url_key);
    }

    function handle_fxa_login(auth_code, state) {
        var loginData = {
            'auth_response': auth_code,
            'state': state || settings.fxa_auth_state,
        };
        // Check for a host secific client_id override. See site_config.js for
        // more info.
        var clientIdOverride = siteConfig.fxa_client_id_for_origin();
        if (clientIdOverride) {
            loginData.client_id = clientIdOverride;
        }
        z.page.trigger('before_login');
        requests.post(urls.api.url('fxa-login'), loginData)
                .done(logIn)
                .fail(function(jqXHR, textStatus, error) {
            console.warn('FxA login failed', jqXHR, textStatus, error);
            logInFailed();
        }).always(function() {
            if (fxa_popup && !retainPopup) {
                console.log('Closing login popup');
                fxa_popup.close();
            } else if (fxa_popup) {
                console.log('Keeping window around for re-use');
            }
        });
    }

    function fxa_redirect_url(opt) {
        opt = opt || {};
        var action = opt.register ? 'signup' : 'signin';
        return utils.urlparams(settings.fxa_auth_url, {action: action});
    }

    return {
        login: startLogin,
        fxa_redirect_url: fxa_redirect_url,
        get_fxa_auth_url: get_fxa_auth_url,
        handle_fxa_login: handle_fxa_login,
    };
});
