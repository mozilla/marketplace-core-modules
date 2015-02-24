define('views/homepage', [], function() {});
define('views/app', [], function() {});
define('views/two_args', [], function() {});

define('tests/urls',
    ['core/router', 'core/urls', 'core/user',
     'views/homepage', 'views/app', 'views/two_args'],
    function(router, urls, user) {

    function mock_routes(routes, runner, done) {
        var oldRoutes = router.routes;
        router.clearRoutes();
        router.addRoutes(routes);
        try {
            runner();
        } catch(e) {
            done(e);
        }
        router.clearRoutes();
        router.addRoutes(oldRoutes);
    }

    describe('urls.reverse', function() {
        it('reverses urls', function(done) {
            mock_routes([
                {pattern: '^/$', view_name: 'homepage'},
                {pattern: '^/app/(.+)$', view_name: 'app'}
            ], function() {
                assert.equal(urls.reverse('homepage'), '/');
                assert.equal(urls.reverse('app', ['slug']), '/app/slug');
                done();
            }, done);
        });

        it('errors with missing args', function(done) {
            mock_routes([
                {pattern: '^/$', view_name: 'homepage'},
                {pattern: '^/app/(.+)$', view_name: 'app'}
            ], function() {
                try {
                    urls.reverse('app', []);
                } catch(e) {
                    return done();
                }
                done(new Error('reverse() did not throw exception'));
            }, done);
        });

        it('errors with too many args', function(done) {
            mock_routes([
                {pattern: '^/$', view_name: 'homepage'},
                {pattern: '^/app/(.+)$', view_name: 'app'}
            ], function() {
                try {
                    urls.reverse('app', ['foo', 'bar']);
                } catch(e) {
                    return done();
                }
                done(new Error('reverse() did not throw exception'));
            }, done);
        });

        it('can have multiple args', function(done) {
            mock_routes([
                {pattern: '^/apps/([0-9]+)/reviews/([0-9]+)$', view_name: 'two_args'},
            ], function() {
                var reversed = urls.reverse('two_args', [10, 20]);
                assert.equal('/apps/10/reviews/20', reversed);
                done();
            }, done);
        });
    });

    describe('urls.api.url', function() {
        this.afterEach(function() {
            router.api.clearRoutes();
        });

        it('gives a url', function() {
            router.api.addRoutes({'homepage': '/foo/homepage'});
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {},
            }, function() {
                var homepage_url = urls.api.url('homepage');
                assert.equal(homepage_url.substr(0, 17), 'api:/foo/homepage');
            });
        });

        it('signs URLs', function() {
            router.api.addRoutes({'homepage': '/foo/homepage'});
            sinon.stub(user, 'logged_in').returns(true);
            sinon.stub(user, 'get_setting').returns(null);
            sinon.stub(user, 'get_token').returns('mytoken');
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {}
            }, function() {
                var homepage_url, homepage_base_url = urls.api.base.url('homepage');

                homepage_url = homepage_base_url;
                assert.equal(homepage_url, 'api:/foo/homepage');

                homepage_url = urls.api.url('homepage');
                assert.equal(homepage_url, urls.api.sign(homepage_base_url));
                assert.include(homepage_url, '_user=mytoken');

                homepage_url = urls.api.unsigned.url('homepage');
                assert.equal(homepage_url, urls.api.unsign(homepage_base_url));
                assert.notInclude(homepage_url, '_user=mytoken');
            });
        });

        it('api url blacklist', function() {
            router.api.addRoutes({'homepage': '/foo/homepage'});
            withSettings({
                api_cdn_whitelist: {},
                api_url: 'api:',
                api_param_blacklist: ['region']
            }, function() {
                var homepage_url = urls.api.url('homepage');
                assert.equal(homepage_url.substr(0, 17), 'api:/foo/homepage');
                assert.notInclude(homepage_url, 'region=');
            });
        });

        it('api url CDN whitelist', function() {
            router.api.addRoutes({
                'homepage': '/api/v1/homepage/',
                'search': '/api/v1/fireplace/search/?swag=yolo',
            });
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {
                    '/api/v1/fireplace/search/': 60,  // 1 minute
                    '/api/v1/fireplace/search/featured/': 60 * 2,  // 2 minutes
                },
                media_url: 'http://cdn.so.fast.omg.org'
            }, function() {
                var homepage_url = urls.api.url('homepage');
                assert.equal(homepage_url.substr(0, 21), 'api:/api/v1/homepage/');

                var search_url = urls.api.url('search');
                assert.equal(search_url.substr(0, 51),
                    'http://cdn.so.fast.omg.org/api/v1/fireplace/search/');
            });
        });
    });

    describe('urls.api.url.params', function() {
        this.beforeEach(function() {
            router.api.addRoutes({'homepage': '/foo/asdf'});
        });

        this.afterEach(function() {
            router.api.clearRoutes();
            router.api.clearProcessors();
        });

        it('sets query args', function() {
            withSettings({
                api_url: 'api:',
                api_cdn_whitelist: {}
            }, function() {
                var homepage_url = urls.api.params('homepage', {q: 'poop'});
                assert.equal(homepage_url.substr(0, 13), 'api:/foo/asdf');
                assert.include(homepage_url, 'q=poop');
            });
        });

        it('uses api.args', function() {
            // FIXME: This is just testing the processor I added.
            var dev;
            var device;
            router.api.addProcessor(function(endpoint) {
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
                assert.equal(homepage_url.substr(0, 13), 'api:/foo/asdf');
                assert.include(homepage_url, 'q=poop');
                assert.notInclude(homepage_url, 'device');

                device = null;
                homepage_url = urls.api.params('homepage', {q: 'poop'});
                assert.notInclude(homepage_url, 'device');

                device = 'customdevice';
                homepage_url = urls.api.params('homepage', {q: 'poop'});
                assert.include(homepage_url, 'device=customdevice');

                dev = 'customdev';
                device = 'customdevice';
                homepage_url = urls.api.params('homepage', {q: 'poop'});
                assert.include(homepage_url, 'device=customdevice');
                assert.include(homepage_url, 'dev=customdev');
            });
        });
    });
});
