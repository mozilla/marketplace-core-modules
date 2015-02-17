define('tests/l10n', ['l10n'], function(eltenen) {

    function MockNavigator(strings, pluralizer) {
        this.l10n = {
            strings: strings,
            pluralize: pluralizer
        };
    }

    var basic_context = new MockNavigator(
        {foo: {body: 'bar'},
        formatted: {body: 'zip {zap}'},
        sing: {plurals: ['zero {n}', 'one {n}']},
        sing2: {plurals: ['zero {n} {asdf}', 'one {n} {asdf}']}},
        function(n) {return n - 1 !== 0;}
    );

    describe('l10n.gettext', function() {
        it('translates', function() {
            assert.equal(eltenen.gettext('foo', null, basic_context), 'bar');
        });

        it('has a fallback', function() {
            assert.equal(eltenen.gettext('does not exist', null, basic_context), 'does not exist');
        });

        it('accepts args', function() {
            assert.equal(eltenen.gettext('formatted', {zap: 123}, basic_context), 'zip 123');
        });

        it('has fallback args', function() {
            assert.equal(eltenen.gettext('does not {exist}', {exist: 123}, basic_context), 'does not 123');
        });
    });

    describe('l10n.ngettext', function() {
        it('translates plurals', function() {
            assert.equal(eltenen.ngettext('sing', 'plural', {n: 1}, basic_context), 'zero 1');
            assert.equal(eltenen.ngettext('sing', 'plural', {n: 2}, basic_context), 'one 2');
        });

        it('can have multiple pluralizations', function() {
            var context = new MockNavigator(
                {sing: {plurals: ['0{n}', '1{n}', '2{n}', '3{n}']}},
                function(n) {return n;}
            );
            assert.equal(eltenen.ngettext('sing', 'plural', {n: 0}, context), '00');
            assert.equal(eltenen.ngettext('sing', 'plural', {n: 1}, context), '11');
            assert.equal(eltenen.ngettext('sing', 'plural', {n: 2}, context), '22');
            assert.equal(eltenen.ngettext('sing', 'plural', {n: 3}, context), '33');
        });

        it('has a fallback', function() {
            assert.equal(eltenen.ngettext('foo {n}', 'bar {n}', {n: 1}, basic_context), 'foo 1');
            assert.equal(eltenen.ngettext('foo {n}', 'bar {n}', {n: 2}, basic_context), 'bar 2');
        });

        it('accepts args', function() {
            assert.equal(eltenen.ngettext('sing2', 'sang2', {n: 1, asdf: 'bar'}, basic_context), 'zero 1 bar');
            assert.equal(eltenen.ngettext('sing2', 'sang2', {n: 2, asdf: 'bar'}, basic_context), 'one 2 bar');
        });

        it('has fallback args', function() {
            assert.equal(eltenen.ngettext('foo {n} {asdf}', '', {n: 1, asdf: 'bar'}, basic_context),
                'foo 1 bar');
            assert.equal(eltenen.ngettext('', 'foo {n} {asdf}', {n: 2, asdf: 'bar'}, basic_context),
                'foo 2 bar');
        });

        it('errors without n argument', function(done, fail) {
            try {
                console.error(eltenen.ngettext('singular', 'plural', {not_n: 1}, basic_context));
            } catch (e) {
                return done();
            }
            fail();
        });
    });

    describe('l10n', function() {
        it('getDirection handles language directions', function() {
            var context = {language: 'en-US'};
            assert.equal(eltenen.getDirection(context), 'ltr');
            context.language = 'pt-BR';
            assert.equal(eltenen.getDirection(context), 'ltr');
            context.language = 'ar';
            assert.equal(eltenen.getDirection(context), 'rtl');
            context.language = 'ar-AR';
            assert.equal(eltenen.getDirection(context), 'rtl');
            context.language = 'ar-POOP';
            assert.equal(eltenen.getDirection(context), 'rtl');
        });

        it('getLocale helps find a locale', function() {
            // Exact matches
            assert.equal(eltenen.getLocale('en-US'), 'en-US');
            // Shortened matches
            assert.equal(eltenen.getLocale('de-DE'), 'de');
            // Re-expanded matches
            assert.equal(eltenen.getLocale('en-FOO'), 'en-US');
            // Potato matches
            assert.equal(eltenen.getLocale('potato-LOCALE'), 'en-US');
        });

        it('getLocaleSrc gives a URL/path to a locale file', function() {
            // Mock document.body.getAttribute to test with different data-*
            // attributes.
            var doc = {
                body: {
                    getAttribute: function(attr) {
                        return doc.body[attr];
                    }
                }
            };
            assert.equal(eltenen.getLocaleSrc('en-US', doc), '/media/locales/en-US.js');

            doc.body['data-media'] = 'https://cdn.example.com/somewhere/';
            assert.equal(eltenen.getLocaleSrc('en-US', doc),
                'https://cdn.example.com/somewhere/locales/en-US.js');

            doc.body['data-media'] = 'https://cdn.example.com/somewhere/';
            doc.body['data-repo'] = 'bar';
            assert.equal(eltenen.getLocaleSrc('en-US', doc),
                'https://cdn.example.com/somewhere/bar/locales/en-US.js');

            doc.body['data-media'] = 'https://cdn.example.com/somewhere/';
            doc.body['data-repo'] = 'bar';
            doc.body['data-build-id-js'] = '4815162342';
            assert.equal(eltenen.getLocaleSrc('en-US', doc),
                'https://cdn.example.com/somewhere/bar/locales/en-US.js?b=4815162342');
        });
    });
});
