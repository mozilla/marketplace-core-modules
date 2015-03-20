define('core/user',
    ['core/capabilities', 'core/log', 'core/storage', 'core/utils'],
    function(capabilities, log, storage, utils) {
    var logger = log('user');

    var token;
    var user_settings = {};
    var permissions = {};
    var apps = {
        'installed': [],
        'purchased': [],
        'developed': []
    };

    // Try to initialize items from localStorage.
    token = storage.getItem('user');
    user_settings = storage.getItem('settings') || {};
    permissions = storage.getItem('permissions') || {};

    var _stored = storage.getItem('user_apps');
    if (_stored) {
        apps = _stored;
    }

    log.unmention(token);
    save_user_settings();

    function clear_user_settings() {
        user_settings = {};
    }

    function clear_token() {
        logger.log('Clearing token');

        storage.removeItem('user');
        if ('email' in user_settings) {
            delete user_settings.email;
            save_user_settings();
            permissions = {};
            save_permissions();
            apps = {
                'installed': [],
                'purchased': [],
                'developed': []
            };
            save_apps();
        }
        token = null;
    }

    function get_user_setting(setting, default_) {
        if (user_settings.hasOwnProperty(setting)) {
            return user_settings[setting];
        } else {
            return default_;
        }
    }

    function get_permission(setting) {
        return permissions[setting] || false;
    }

    function get_user_settings() {
        return user_settings;
    }

    function get_apps() {
        return apps;
    }

    function has_developed(app_id) {
        return apps.developed.indexOf(app_id) !== -1;
    }

    function has_installed(app_id) {
        return apps.installed.indexOf(app_id) !== -1;
    }

    function has_purchased(app_id) {
        return apps.purchased.indexOf(app_id) !== -1;
    }

    function set_token(new_token, new_user_settings) {
        logger.log('Setting new token');
        if (!new_token) {
            return;
        }
        token = new_token;
        // Make sure that we don't ever log the user token.
        log.unmention(new_token);

        storage.setItem('user', token);

        // Update the user's settings with the ones that are in the
        // login API response.
        update_user_settings(new_user_settings);
    }

    function save_user_settings() {
        logger.log('Saving settings');
        storage.setItem('settings', user_settings);
    }

    function update_user_settings(data) {
        if (!data) {
            return;
        }
        logger.log('Updating settings', data);
        _.extend(user_settings, data);
        save_user_settings();
    }

    function save_permissions() {
        logger.log('Saving perms');
        storage.setItem('permissions', permissions);
    }

    function update_permissions(data) {
        if (!data) {
            return;
        }
        logger.log('Updating perms', data);
        permissions = data;
        save_permissions();
    }

    function update_apps(data) {
        if (!data) {
            return;
        }
        logger.log('Updating apps', data);
        apps = data;
        save_apps();
    }

    function update_install(app_id) {
        logger.log('Adding to apps.installed', app_id);
        apps.installed.push(app_id);
        save_apps();
    }

    function update_purchased(app_id) {
        logger.log('Adding to apps.purchased', app_id);
        apps.purchased.push(app_id);
        save_apps();
    }

    function save_apps() {
        logger.log('Saving apps');
        storage.setItem('user_apps', apps);
    }

    function hasLoggedIn() {
        // We set `permissions` on login and reset it to `{}` on logout so we
        // can use that to tell if this device has ever logged in.
        return !!storage.getItem('permissions');
    }

    return {
        clear_settings: clear_user_settings,
        clear_token: clear_token,
        get_apps: get_apps,
        get_permission: get_permission,
        get_setting: get_user_setting,
        get_settings: get_user_settings,
        get_token: function() {return token;},
        has_developed: has_developed,
        has_installed: has_installed,
        has_purchased: has_purchased,
        logged_in: function() {return !!token;},
        set_token: set_token,
        update_apps: update_apps,
        update_install: update_install,
        update_permissions: update_permissions,
        update_purchased: update_purchased,
        update_settings: update_user_settings,
    };
});
