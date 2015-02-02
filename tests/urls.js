/*
(function() {
var a = require('assert');
var assert = a.assert;
var eq_ = a.eq_;
var contains = a.contains;
var disincludes = a.disincludes;
var mock = a.mock;

var urls = require('urls');

function mock_routes(routes, runner, fail) {
    var temp = window.routes;
    window.routes = routes;
    try {
        runner();
    } catch(e) {
        fail(e);
    }
    window.routes = temp;
}

test('reverse', function(done, fail) {
    mock_routes([
        {pattern: '^/$', view_name: 'homepage'},
        {pattern: '^/app/(.+)$', view_name: 'app'}
    ], function() {
        var reverse = urls.reverse;
        eq_(reverse('homepage'), '/');
        eq_(reverse('app', ['slug']), '/app/slug');
        done();
    }, fail);
});

test('reverse missing args', function(done, fail) {
    mock_routes([
        {pattern: '^/$', view_name: 'homepage'},
        {pattern: '^/app/(.+)$', view_name: 'app'}
    ], function() {
        var reverse = urls.reverse;
        try {
            reverse('app', []);
        } catch(e) {
            return done();
        }
        fail('reverse() did not throw exception');
    }, fail);
});

test('reverse too many args', function(done, fail) {
    mock_routes([
        {pattern: '^/$', view_name: 'homepage'},
        {pattern: '^/app/(.+)$', view_name: 'app'}
    ], function() {
        var reverse = urls.reverse;
        try {
            reverse('app', ['foo', 'bar']);
        } catch(e) {
            return done();
        }
        fail('reverse() did not throw exception');
    }, fail);
});

test('reverse multiple args', function(done, fail) {
    mock_routes([
        {pattern: '^/apps/([0-9]+)/reviews/([0-9]+)$', view_name: 'two_args'},
    ], function() {
        var reversed = urls.reverse('two_args', [10, 20]);
        eq_('/apps/10/reviews/20', reversed);
        done();
    }, fail);
});

test('api url', function(done, fail) {
    mock(
        'urls',
        {
            api_args: function(url) { return {};},
            routes_api: {'homepage': '/foo/homepage'},
            settings: {
                api_url: 'api:',
                api_cdn_whitelist: {},
            }
        }, function(urls) {
            var homepage_url = urls.api.url('homepage');
            eq_(homepage_url.substr(0, 17), 'api:/foo/homepage');
            done();
        },
        fail
    );
});

test('api url signage', function(done, fail) {
    mock(
        'urls',
        {
            api_args: function(url) { return {};},
            routes_api: {'homepage': '/foo/homepage'},
            settings: {
                api_url: 'api:',
                api_cdn_whitelist: {}
            },
            user: {
                logged_in: function() { return true; },
                get_setting: function(x) {},
                get_token: function() { return 'mytoken';}
            }
        }, function(urls) {
            var homepage_url, homepage_base_url = urls.api.base.url('homepage');

            homepage_url = homepage_base_url;
            eq_(homepage_url, 'api:/foo/homepage');

            homepage_url = urls.api.url('homepage');
            eq_(homepage_url, urls.api.sign(homepage_base_url));
            contains(homepage_url, '_user=mytoken');

            homepage_url = urls.api.unsigned.url('homepage');
            eq_(homepage_url, urls.api.unsign(homepage_base_url));
            disincludes(homepage_url, '_user=mytoken');
            done();
        },
        fail
    );
});

test('api url blacklist', function(done, fail) {
    mock(
        'urls',
        {
            api_args: function(url) { return {};},
            routes_api: {'homepage': '/foo/homepage'},
            settings: {
                api_cdn_whitelist: {},
                api_url: 'api:',
                api_param_blacklist: ['region']
            }
        }, function(urls) {
            var homepage_url = urls.api.url('homepage');
            eq_(homepage_url.substr(0, 17), 'api:/foo/homepage');
            disincludes(homepage_url, 'region=');
            done();
        },
        fail
    );
});

test('api url CDN whitelist', function(done, fail) {
    mock(
        'urls',
        {
            routes_api: {
                'homepage': '/api/v1/homepage/',
                'search': '/api/v1/fireplace/search/?swag=yolo'
            },
            settings: {
                api_url: 'api:',
                api_cdn_whitelist: {
                    '/api/v1/fireplace/search/': 60,  // 1 minute
                    '/api/v1/fireplace/search/featured/': 60 * 2,  // 2 minutes
                },
                media_url: 'http://cdn.so.fast.omg.org'
            }
        }, function(urls) {
            var homepage_url = urls.api.url('homepage');
            eq_(homepage_url.substr(0, 21), 'api:/api/v1/homepage/');

            var search_url = urls.api.url('search');
            eq_(search_url.substr(0, 51),
                'http://cdn.so.fast.omg.org/api/v1/fireplace/search/');

            done();
        },
        fail
    );
});

test('api url params', function(done, fail) {
    mock(
        'urls',
        {
            routes_api: {'homepage': '/foo/asdf'},
            settings: {
                api_url: 'api:',
                api_cdn_whitelist: {}
            }
        }, function(urls) {
            var homepage_url = urls.api.params('homepage', {q: 'poop'});
            eq_(homepage_url.substr(0, 13), 'api:/foo/asdf');
            contains(homepage_url, 'q=poop');
            done();
        },
        fail
    );
});

test('api url params api_args', function(done, fail) {
    var api_args = {};
    mock(
        'urls',
        {
            // Bit of a weird mock, but route_api_args directly returns a
            // function so we have to do this.
            routes_api_args: function() {
                return function() {
                    return function() {
                        return api_args;
                    };
                };
            },
            routes_api: {'homepage': '/foo/asdf'},
            settings: {
                api_url: 'api:',
                api_cdn_whitelist: {}
            }
        }, function(urls) {
            var homepage_url = urls.api.params('homepage', {q: 'poop'});
            eq_(homepage_url.substr(0, 13), 'api:/foo/asdf');
            contains(homepage_url, 'q=poop');
            disincludes(homepage_url, 'device');

            api_args.device = null;
            homepage_url = urls.api.params('homepage', {q: 'poop'});
            disincludes(homepage_url, 'device');

            api_args.device = 'customdevice';
            homepage_url = urls.api.params('homepage', {q: 'poop'});
            contains(homepage_url, 'device=customdevice');

            api_args.dev = 'customdev';
            api_args.device = 'customdevice';
            homepage_url = urls.api.params('homepage', {q: 'poop'});
            contains(homepage_url, 'device=customdevice');
            contains(homepage_url, 'dev=customdev');

            done();
        },
        fail
    );
});

})();
*/
