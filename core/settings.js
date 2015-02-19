define('core/settings', ['underscore'], function(_) {
    var settings = {
        _extend: function(extra_settings) {
            _.extend(settings, extra_settings);
        },
        switches: [],
    };
    return settings;
});
