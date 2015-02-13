define('core/settings', ['underscore'], function(_) {
    var settings = {
        _extend: function(extra_settings) {
            // Hopefully `_extend` isn't in `extra_setting` mirite?
            _.extend(settings, extra_settings);
        },
        switches: [],
    };
    return settings;
});
