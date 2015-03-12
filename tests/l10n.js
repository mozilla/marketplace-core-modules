define('tests/l10n', ['core/l10n'], function(l10n) {
    function MockNavigator(strings, pluralizer) {
        this.l10n = {
            strings: strings,
            pluralize: pluralizer
        };
    }

    var mockContext = new MockNavigator(
        {foo: {body: 'bar'},
        formatted: {body: 'zip {zap}'},
        sing: {plurals: ['zero {n}', 'one {n}']},
        sing2: {plurals: ['zero {n} {asdf}', 'one {n} {asdf}']}},
        function(n) {return n - 1 !== 0;}
    );

    describe('l10n.getDirection', function() {
        it('handles language directions', function() {
            var context = {language: 'en-US'};
            assert.equal(l10n.getDirection(context), 'ltr');
            context.language = 'pt-BR';
            assert.equal(l10n.getDirection(context), 'ltr');
            context.language = 'ar';
            assert.equal(l10n.getDirection(context), 'rtl');
            context.language = 'ar-AR';
            assert.equal(l10n.getDirection(context), 'rtl');
            context.language = 'ar-POOP';
            assert.equal(l10n.getDirection(context), 'rtl');
        });
    });

    describe('l10n.gettext', function() {
        it('translates', function() {
            assert.equal(l10n.gettext('foo', null, mockContext), 'bar');
        });

        it('has a fallback', function() {
            assert.equal(l10n.gettext('does not exist', null, mockContext),
                         'does not exist');
        });

        it('accepts args', function() {
            assert.equal(l10n.gettext('formatted', {zap: 123}, mockContext),
                         'zip 123');
        });

        it('has fallback args', function() {
            assert.equal(l10n.gettext('does not {exist}', {exist: 123},
                                      mockContext),
                         'does not 123');
        });
    });

    describe('l10n.ngettext', function() {
        it('translates plurals', function() {
            assert.equal(l10n.ngettext('sing', 'plural', {n: 1},
                                       mockContext),
                         'zero 1');
            assert.equal(l10n.ngettext('sing', 'plural', {n: 2},
                                       mockContext),
                         'one 2');
        });

        it('can have multiple pluralizations', function() {
            var mockContext = new MockNavigator(
                {sing: {plurals: ['0{n}', '1{n}', '2{n}', '3{n}']}},
                function(n) {return n;}
            );
            assert.equal(l10n.ngettext('sing', 'plural', {n: 0}, mockContext),
                         '00');
            assert.equal(l10n.ngettext('sing', 'plural', {n: 1}, mockContext),
                         '11');
            assert.equal(l10n.ngettext('sing', 'plural', {n: 2}, mockContext),
                         '22');
            assert.equal(l10n.ngettext('sing', 'plural', {n: 3}, mockContext),
                         '33');
        });

        it('has a fallback', function() {
            assert.equal(l10n.ngettext('foo {n}', 'bar {n}', {n: 1},
                                       mockContext),
                         'foo 1');
            assert.equal(l10n.ngettext('foo {n}', 'bar {n}', {n: 2},
                                       mockContext),
                         'bar 2');
        });

        it('accepts args', function() {
            assert.equal(l10n.ngettext('sing2', 'sang2', {n: 1, asdf: 'bar'},
                                       mockContext),
                         'zero 1 bar');
            assert.equal(l10n.ngettext('sing2', 'sang2', {n: 2, asdf: 'bar'},
                                       mockContext),
                         'one 2 bar');
        });

        it('has fallback args', function() {
            assert.equal(l10n.ngettext('foo {n} {asdf}', '',
                                       {n: 1, asdf: 'bar'}, mockContext),
                         'foo 1 bar');
            assert.equal(l10n.ngettext('', 'foo {n} {asdf}',
                                       {n: 2, asdf: 'bar'}, mockContext),
                         'foo 2 bar');
        });

        it('errors without n argument', function(done, fail) {
            try {
                console.error(l10n.ngettext('singular', 'plural', {not_n: 1},
                                            mockContext));
            } catch (e) {
                return done();
            }
            fail();
        });
    });
});
