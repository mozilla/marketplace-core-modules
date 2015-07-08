define('tests/l10n_init',
    ['core/l10n_init', 'Squire'],
    function(l10n_init, Squire) {

    function MockDoc() {
        // Mock doc.body.getAttribute to test with different data-attrs.
        var doc = {
            body: {
                getAttribute: function(attr) {
                    return doc.body[attr];
                }
            }
        };
        return doc;
    }

    describe('l10n_init.injectLocaleScript', function() {
        beforeEach(function() {
            document.body.setAttribute('data-media', '/base/tests/files/');
        });
        afterEach(function() {
            window.navigator.l10n = undefined;
        });

        it('injects script tag', function() {
            l10n_init.injectLocaleScript(null, 'de');

            // Verify on the DOM.
            var scripts = document.querySelectorAll('script');
            var poScript = scripts[scripts.length - 1];
            assert.ok(poScript.src.indexOf('/base/tests/files/locales/de.js') !== -1);
        });

        it('injects script tag with test fixture file', function(done) {
            // Test with an actual locale file (tests/locales/es.js).
            var promise = l10n_init.injectLocaleScript(null, 'es');

            // Verify on the DOM.
            var scripts = document.querySelectorAll('script');
            var poScript = scripts[scripts.length - 1];
            assert.ok(poScript.src.indexOf('/base/tests/files/locales/es.js') !== -1);

            // When locale script loads, it should change the language.
            promise.done(function() {
                assert.equal(window.navigator.l10n.language, 'es');
                done();
            });
        });

        it('fall back to en-US if script error', function(done) {
            l10n_init.injectLocaleScript(null, 'de').done(function() {
                // When locale script 404s, it should fall back to en-US.
                assert.equal(window.navigator.l10n.language, 'en-US');
                done();
            });
        });
    });

    describe('l10n_init.getLocale', function() {
        it('gets exact match', function() {
            // Exact matches
            assert.equal(l10n_init.getLocale('en-US'), 'en-US');
        });

        it('gets shortened match', function() {
            // Shortened matches
            assert.equal(l10n_init.getLocale('de-DE'), 'de');
        });

        it('gets re-expanded match', function() {
            // Re-expanded matches
            assert.equal(l10n_init.getLocale('en-FOO'), 'en-US');
        });

        it('gets potato match', function() {
            // Potato matches
            assert.equal(l10n_init.getLocale('potato-LOCALE'), 'en-US');
        });

        it('get undefined match', function() {
            // Undefined matches
            assert.equal(l10n_init.getLocale(undefined), 'en-US');
        });
    });

    describe('l10n_init.getLocaleSrc', function() {
        it('gets path without data-media', function() {
            var doc = MockDoc();
            assert.equal(l10n_init.getLocaleSrc('en-US', doc),
                         '/media/locales/en-US.js');
        });

        it('gets URL with data-media', function() {
            var doc = MockDoc();
            doc.body['data-media'] = 'https://cdn.example.com/somewhere/';
            assert.equal(l10n_init.getLocaleSrc('en-US', doc),
                         'https://cdn.example.com/somewhere/locales/en-US.js');
        });

        it('gets URL with data-media and data-repo', function() {
            var doc = MockDoc();
            doc.body['data-media'] = 'https://cdn.example.com/somewhere/';
            doc.body['data-repo'] = 'bar';
            assert.equal(
                l10n_init.getLocaleSrc('en-US', doc),
                'https://cdn.example.com/somewhere/bar/locales/en-US.js');
        });

        it('gets URL with data-media and data-repo and build ID', function() {
            var doc = MockDoc();
            doc.body['data-media'] = 'https://cdn.example.com/somewhere/';
            doc.body['data-repo'] = 'bar';
            doc.body['data-build-id-js'] = '4815162342';
            assert.equal(
                l10n_init.getLocaleSrc('en-US', doc),
                'https://cdn.example.com/somewhere/bar/locales/en-US.js?b=4815162342');
        });
    });

    describe('l10n_init.languages', function() {
        it('uses data-languages on <body>', function(done) {
            document.body.setAttribute('data-languages', '["foo","bar"]');
            new Squire().require(['core/l10n_init'], function(l10n_init) {
                assert.deepEqual(l10n_init.languages, ['foo', 'bar']);
                document.body.removeAttribute('data-languages');
                done();
            });
        });

        it('uses default languages without data-languages', function(done) {
            document.body.removeAttribute('data-languages');
            new Squire().require(['core/l10n_init'], function(l10n_init) {
                // Don't look for specific languages, just that we have some.
                assert(l10n_init.languages.length > 20);
                done();
            });
        });
    });
});
