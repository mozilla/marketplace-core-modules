define('tests/site_config',
    ['core/defer', 'core/requests', 'core/settings', 'core/site_config',
     'core/urls', 'core/z'],
    function(defer, requests, settings, siteConfig, urls, z) {

    function mockSiteConfigRequestSuccess(data) {
        sinon.stub(requests, 'get', function(args) {
            var def = defer.Deferred();
            def.args = args;
            def.resolve(data);
            return def;
        });
    }

    describe('site_config', function() {
        this.afterEach(function() {
            delete settings.fxa_auth_state;
            delete settings.fxa_auth_url;
        });

        it('sets waffle switches', function() {
            withSettings({api_cdn_whitelist: {}, switches: []}, function() {
                mockSiteConfigRequestSuccess({
                    waffle: {
                        switches: ['dummy-switch']
                    }
                });
                siteConfig.fetch().then(function() {
                    assert.equal(settings.switches.length, 1);
                    assert.include(settings.switches, 'dummy-switch');
                });
            });
        });

        it('sets waffle switches object', function() {
            withSettings({api_cdn_whitelist: {}, switches: []}, function() {
                mockSiteConfigRequestSuccess({
                    waffle: {
                        // Not an array, old-style response, will be ignored.
                        switches: {'dummy-switch': {'somedata': 1}}
                    }
                });
                siteConfig.fetch().then(function() {
                    assert.equal(settings.switches.length, 0);
                });
            });
        });

        it('sets fxa auth', function() {
            withSettings({api_cdn_whitelist: {}, switches: []}, function() {
                mockSiteConfigRequestSuccess({
                    waffle: {
                        switches: ['dummy-switch']
                    },
                    fxa: {
                        fxa_auth_url: 'http://ngokevin.com?client_id=abc123',
                        fxa_auth_state: 'somemoreseolongtoken'
                    }
                });
                siteConfig.fetch().then(function() {
                    // We can't be sure of the client_id since it will change based
                    // on the URL you use to run the tests.
                    assert.equal(settings.fxa_auth_url.indexOf('http://ngokevin.com?client_id='), 0);
                    assert.equal(settings.fxa_auth_state, 'somemoreseolongtoken');
                });
            });
        });

        it('handles no fxa auth data', function() {
            withSettings({api_cdn_whitelist: {}, switches: []}, function() {
                mockSiteConfigRequestSuccess({
                    waffle: {
                        switches: ['dummy-switch']
                    },
                });
                siteConfig.fetch().then(function() {
                    assert.equal(settings.fxa_auth_url, undefined);
                    assert.equal(settings.fxa_auth_state, undefined);
                });
            });
        });

        it('no request is made if data is present in body', function() {
            withSettings({
                api_cdn_whitelist: {},
                switches: []
            }, function() {
                var body_attributes = {
                    settings: {
                        'fxa_auth_url': 'dummy_fxa_auth_url',
                        'fxa_auth_state': 'dummy_fxa_auth_state'
                    },
                    'waffle-switches': ['switch1', 'switch2']
                };
                sinon.stub(requests, 'get', function(url) {
                    fail('We tried to make a request to ' + url);
                    return defer.Deferred();
                });
                sinon.stub(z.body, 'data', function(key) {
                    return body_attributes[key];
                });
                sinon.stub(z.win, 'on', function() {});
                sinon.stub(siteConfig, 'update_fxa_url_client_id').returns(null);
                siteConfig.fetch().then(function() {
                    assert.equal(settings.fxa_auth_url, 'dummy_fxa_auth_url');
                    assert.equal(settings.fxa_auth_state, 'dummy_fxa_auth_state');
                    assert.deepEqual(settings.switches, ['switch1', 'switch2']);
                });
            });
        });

        it('sets fxa client id localhost', function() {
            var url = 'http://ngokevin.com?client_id=abc123&auth_state=def456';
            var newUrl = siteConfig.update_fxa_url_client_id(url, 'http://localhost:8679');
            assert.equal(newUrl,
                'http://ngokevin.com?auth_state=def456&client_id=049d4b105daa1cb9');
        });

        it('does not change client id', function() {
            var url = 'http://ngokevin.com?client_id=abc123&auth_state=def456';
            var newUrl = siteConfig.update_fxa_url_client_id(url, 'http://somehost:8679');
            assert.equal(newUrl, url);
        });

    });
});
