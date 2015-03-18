define('tests/init',
    ['core/init', 'Squire'],
    function(init, Squire) {

    describe('init', function() {
        it('sets up l10n', function(done) {
            var injector = new Squire();
            require(['core/init'], function(init) {
                init.ready.done(function() {
                    assert.ok(window.navigator.l10n);
                    done();
                });
            });
        });

        it('sets up helpers', function(done) {
            var injector = new Squire();
            injector.require(['core/nunjucks'], function(nunjucks) {
                assert.equal(nunjucks.require('globals').url, undefined);

                require(['core/init', 'core/nunjucks'], function(init, nunjucks) {
                    assert.ok(nunjucks.require('globals').url);
                    done();
                });
            });
        });

        it('sets up routes', function(done) {
            var injector = new Squire();
            injector.require(['core/router'], function(router) {
                assert.equal(router.routes.length, 0);
                assert.equal(Object.keys(router.api.routes).length, 0);

                injector.require(['core/init'], function() {
                    assert.ok(router.routes.length > 0);
                    assert.ok(Object.keys(router.api.routes).length > 0);
                    done();
                });
            });
        });

        it('sets up lang API processor', function(done) {
            var injector = new Squire();
            injector.require(['core/router', 'core/urls'],
                             function(router, urls) {
                assert.equal(urls.api.params({}).indexOf('lang='), -1);

                injector.require(['core/init'], function() {
                    assert.ok(urls.api.params({}).indexOf('lang=') !== -1);
                    done();
                });
            });
        });
    });
});
