define('api_endpoints', [], function() {
    var exports = {
        endpoints: {},
        add: function(name, path) { exports.endpoints[name] = path; },
        clearEndpoints: function() { exports.endpoints = {}; },
    };

    return exports;
});
