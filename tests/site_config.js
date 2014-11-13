(function() {
var a = require('assert');
var eq_ = a.eq_;
var feq_ = a.feq_;
var contains = a.contains;
var mock = a.mock;
var defer = require('defer');
var urls = require('urls');

function mockSiteConfigRequestSuccess(data) {
    return function(args) {
        var def = defer.Deferred();
        def.args = args;
        def.resolve(data);
        return def;
    };
}

test('sets waffle switches', function(done, fail) {
    var settings = {
        api_cdn_whitelist: {},
        switches: []
    };
    mock(
        'site_config',
        {
            requests: {
                get: mockSiteConfigRequestSuccess({
                    waffle: {
                        switches: ['dummy-switch']
                    }
                }
            )},
            settings: settings,
        },
        function(siteConfig) {
            var promise = siteConfig.promise;
            promise.then(function() {
                eq_(settings.switches.length, 1);
                contains(settings.switches, 'dummy-switch');
                done();
            });
        },
        fail
    );
});

test('sets waffle switches object', function(done, fail) {
    var settings = {
        api_cdn_whitelist: {},
        switches: []
    };
    mock(
        'site_config',
        {
            requests: {
                get: mockSiteConfigRequestSuccess({
                    waffle: {
                        // Not an array, old-style response, will be ignored.
                        switches: {'dummy-switch': {'somedata': 1}}
                    }
                }
            )},
            settings: settings,
        },
        function(siteConfig) {
            var promise = siteConfig.promise;
            promise.then(function() {
                eq_(settings.switches.length, 0);
                done();
            });
        },
        fail
    );
});

test('sets fxa auth', function(done, fail) {
    var settings = {
        api_cdn_whitelist: {},
        switches: []
    };
    mock(
        'site_config',
        {
            requests: {
                get: mockSiteConfigRequestSuccess({
                    waffle: {
                        switches: ['dummy-switch']
                    },
                    fxa: {
                        fxa_auth_url: 'http://ngokevin.com?client_id=abc123',
                        fxa_auth_state: 'somemoreseolongtoken'
                    }
                }
            )},
            settings: settings,
        },
        function(siteConfig) {
            var promise = siteConfig.promise;
            promise.then(function() {
                eq_(settings.fxa_auth_url 'http://ngokevin.com?client_id=abc123');
                eq_(settings.fxa_auth_state, 'somemoreseolongtoken');
                done();
            });
        },
        fail
    );
});

test('handles no fxa auth data', function(done, fail) {
    var settings = {
        api_cdn_whitelist: {},
        switches: []
    };
    mock(
        'site_config',
        {
            requests: {
                get: mockSiteConfigRequestSuccess({
                    waffle: {
                        switches: ['dummy-switch']
                    },
                })
            },
            settings: settings,
        },
        function(siteConfig) {
            var promise = siteConfig.promise;
            promise.then(function() {
                eq_(settings.fxa_auth_url, undefined);
                eq_(settings.fxa_auth_state, undefined);
                done();
            });
        },
        fail
    );
});

test('no request is made if data is present in body', function(done, fail) {
    var settings = {
        api_cdn_whitelist: {},
        switches: []
    };
    var body_attributes = {
        settings: {
            'fxa_auth_url': 'dummy_fxa_auth_url',
            'fxa_auth_state': 'dummy_fxa_auth_state'
        },
        'waffle-switches': ['switch1', 'switch2']
    };
    mock(
        'site_config',
        {
            requests: {get: function(url) { fail('We tried to make a request to ' + url); return defer.Deferred(); }},
            settings: settings,
            z: {
                body: {
                    data: function(key) {
                        return body_attributes[key];
                    }
                },
                win: {
                    on: function() {}
                }
            }
        },
        function(siteConfig) {
            siteConfig.set_fxa_client_id = function() {};
            siteConfig.promise.then(function() {
                eq_(settings.fxa_auth_url, 'dummy_fxa_auth_url');
                eq_(settings.fxa_auth_state, 'dummy_fxa_auth_state');
                feq_(settings.switches, ['switch1', 'switch2']);
                done();
            });
        },
        fail
    );
});

test('sets fxa client id localhost', function(done, fail) {
    mock('site_config', {},
        function(siteConfig) {
            var url = 'http://ngokevin.com?client_id=abc123&auth_state=def456';
            var newUrl = siteConfig.set_fxa_client_id(url, 'http://localhost:8679');
            eq_(newUrl,
                'http://ngokevin.com?auth_state=def456&client_id=049d4b105daa1cb9');
            done();
        },
        fail
    );
});

test('sets does not set client id', function(done, fail) {
    mock('site_config', {},
        function(siteConfig) {
            var url = 'http://ngokevin.com?client_id=abc123&auth_state=def456';
            var newUrl = siteConfig.set_fxa_client_id(url, 'http://somehost:8679');
            eq_(newUrl, url);
            done();
        },
        fail
    );
});

})();
