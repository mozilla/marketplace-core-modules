define('tests/urls', ['assert', 'api_args', 'api_endpoints', 'urls', 'user'], function(a, api_args, api_endpoints, urls, user) {
    var eq_ = a.eq_;
    var contains = a.contains;
    var disincludes = a.disincludes;
    var mock = a.mock;

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

    describe('urls.reverse', function() {
        it('reverses urls', function(done, fail) {
            mock_routes([
                {pattern: '^/$', view_name: 'homepage'},
                {pattern: '^/app/(.+)$', view_name: 'app'}
            ], function() {
                eq_(urls.reverse('homepage'), '/');
                eq_(urls.reverse('app', ['slug']), '/app/slug');
                done();
            }, fail);
        });

        it('errors with missing args', function(done, fail) {
            mock_routes([
                {pattern: '^/$', view_name: 'homepage'},
                {pattern: '^/app/(.+)$', view_name: 'app'}
            ], function() {
                try {
                    urls.reverse('app', []);
                } catch(e) {
                    return done();
                }
                fail('reverse() did not throw exception');
            }, fail);
        });

        it('errors with too many args', function(done, fail) {
            mock_routes([
                {pattern: '^/$', view_name: 'homepage'},
                {pattern: '^/app/(.+)$', view_name: 'app'}
            ], function() {
                try {
                    urls.reverse('app', ['foo', 'bar']);
                } catch(e) {
                    return done();
                }
                fail('reverse() did not throw exception');
            }, fail);
        });

        it('can have multiple args', function(done, fail) {
            mock_routes([
                {pattern: '^/apps/([0-9]+)/reviews/([0-9]+)$', view_name: 'two_args'},
            ], function() {
                var reversed = urls.reverse('two_args', [10, 20]);
                eq_('/apps/10/reviews/20', reversed);
                done();
            }, fail);
        });
    });

    describe('api.url', function() {
        this.afterEach(function() {
            api_endpoints.clearEndpoints();
            urls.set_cdn_url();
        });

        it('gives a url', function() {
            api_endpoints.add('homepage', '/foo/homepage');
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {},
            }, function() {
                var homepage_url = urls.api.url('homepage');
                eq_(homepage_url.substr(0, 17), 'api:/foo/homepage');
            });
        });

        it('signs URLs', function() {
            api_endpoints.add('homepage', '/foo/homepage');
            sinon.stub(user, 'logged_in').returns(true);
            sinon.stub(user, 'get_setting').returns(null);
            sinon.stub(user, 'get_token').returns('mytoken');
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {}
            }, function() {
                var homepage_url, homepage_base_url = urls.api.base.url('homepage');

                homepage_url = homepage_base_url;
                eq_(homepage_url, 'api:/foo/homepage');

                homepage_url = urls.api.url('homepage');
                eq_(homepage_url, urls.api.sign(homepage_base_url));
                contains(homepage_url, '_user=mytoken');

                homepage_url = urls.api.unsigned.url('homepage');
                eq_(homepage_url, urls.api.unsign(homepage_base_url));
                disincludes(homepage_url, '_user=mytoken');
            });
        });

        it('api url blacklist', function() {
            api_endpoints.add('homepage', '/foo/homepage');
            withSettings({
                api_cdn_whitelist: {},
                api_url: 'api:',
                api_param_blacklist: ['region']
            }, function() {
                var homepage_url = urls.api.url('homepage');
                eq_(homepage_url.substr(0, 17), 'api:/foo/homepage');
                disincludes(homepage_url, 'region=');
            });
        });

        it('api url CDN whitelist', function() {
            api_endpoints.add('homepage', '/api/v1/homepage/');
            api_endpoints.add('search', '/api/v1/fireplace/search/?swag=yolo');
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {
                    '/api/v1/fireplace/search/': 60,  // 1 minute
                    '/api/v1/fireplace/search/featured/': 60 * 2,  // 2 minutes
                },
                media_url: 'http://cdn.so.fast.omg.org'
            }, function() {
                urls.set_cdn_url();
                var homepage_url = urls.api.url('homepage');
                eq_(homepage_url.substr(0, 21), 'api:/api/v1/homepage/');

                var search_url = urls.api.url('search');
                eq_(search_url.substr(0, 51),
                    'http://cdn.so.fast.omg.org/api/v1/fireplace/search/');
            });
        });
    });

    describe('api.url.params', function() {
        this.beforeEach(function() {
            api_endpoints.add('homepage', '/foo/asdf');
        });

        this.afterEach(function() {
            api_endpoints.clearEndpoints();
            api_args.clearProcessors();
        });

        it('sets query args', function() {
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {}
            }, function() {
                var homepage_url = urls.api.params('homepage', {q: 'poop'});
                eq_(homepage_url.substr(0, 13), 'api:/foo/asdf');
                contains(homepage_url, 'q=poop');
            });
        });

        it('uses api_args', function() {
            var dev;
            var device;
            api_args.addProcessor(function(endpoint) {
                var params = {};
                if (device) {
                    params.device = device;
                }
                if (dev) {
                    params.dev = dev;
                }
                return params;
            });
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {}
            }, function() {
                var homepage_url = urls.api.params('homepage', {q: 'poop'});
                eq_(homepage_url.substr(0, 13), 'api:/foo/asdf');
                contains(homepage_url, 'q=poop');
                disincludes(homepage_url, 'device');

                device = null;
                homepage_url = urls.api.params('homepage', {q: 'poop'});
                disincludes(homepage_url, 'device');

                device = 'customdevice';
                homepage_url = urls.api.params('homepage', {q: 'poop'});
                contains(homepage_url, 'device=customdevice');

                dev = 'customdev';
                device = 'customdevice';
                homepage_url = urls.api.params('homepage', {q: 'poop'});
                contains(homepage_url, 'device=customdevice');
                contains(homepage_url, 'dev=customdev');
            });
        });
    });
});
