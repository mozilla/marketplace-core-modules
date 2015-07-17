define('tests/l10n', ['core/l10n'], function(l10n) {
    var mockContext;

    beforeEach(function() {
        mockContext = {
            l10n: {
                language: 'es',
                strings: {
                    'My String': 'El String',
                    'Result': ['Resulto', 'N Resultos'],
                    'Triple Result': ['Un Resulto', 'Dos Resultos', 'Resultos'],
                    'No Plural Form String': 'NPFS',
                    '{arg} String': '{arg} El String',
                    'Plural {arg} String': ['Plurale El String',
                                            'Plurale {arg} Los Stringos'],
                    'Multiple Plurals': ['0{n}', '1{n}', '2{n}', '3{n}'],
                },
                pluralize: function(n) {
                    return n - 1 !== 0;
                }
            }
        };
    });

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
            assert.equal(l10n.gettext('My String', null, mockContext),
                         'El String');
        });

        it('has a fallback', function() {
            assert.equal(l10n.gettext('Fallback', null, mockContext),
                         'Fallback');
        });

        it('accepts args', function() {
            assert.equal(l10n.gettext('{arg} String', {arg: 30}, mockContext),
                         '30 El String');
        });

        it('has fallback args', function() {
            assert.equal(l10n.gettext('Does not {exist}', {exist: 123},
                                      mockContext),
                         'Does not 123');
        });
    });

    describe('10n.gettext_lazy', function() {
        it('translates', function() {
            assert.equal(l10n.gettext_lazy('My String', null, mockContext),
                         'El String');
        });

        it('has a fallback', function() {
            assert.equal(
                l10n.gettext_lazy('does not exist', null, mockContext),
                'does not exist');
        });

        it('accepts args', function() {
            assert.equal(
                l10n.gettext_lazy('{arg} String', {arg: 123}, mockContext),
                '123 El String');
        });

        it('has fallback args', function() {
            assert.equal(
                l10n.gettext_lazy('does not {exist}',
                                  {exist: 123},
                                  mockContext),
                'does not 123');
        });

        it('is evaluated when it is used', function() {
            var context = {l10n: {strings: {foo: {body: 'bar'}}}};
            var translated = l10n.gettext_lazy('My String', null, context);
            context.l10n.strings['My String'] = 'changed';
            assert.equal(translated, 'changed');
        });
    });

    describe('l10n.ngettext', function() {
        it('translates plurals', function() {
            assert.equal(l10n.ngettext('Result', 'plural', {n: 1},
                                       mockContext),
                         'Resulto');
            assert.equal(l10n.ngettext('Result', 'plural', {n: 2},
                                       mockContext),
                         'N Resultos');
        });

        it('can have multiple pluralizations', function() {
            mockContext.l10n.pluralize = function(n) {
                return n;
            };
            assert.equal(l10n.ngettext('Multiple Plurals', 'plural', {n: 0},
                                       mockContext),
                         '00');
            assert.equal(l10n.ngettext('Multiple Plurals', 'plural', {n: 1},
                                       mockContext),
                         '11');
            assert.equal(l10n.ngettext('Multiple Plurals', 'plural', {n: 2},
                                       mockContext),
                         '22');
            assert.equal(l10n.ngettext('Multiple Plurals', 'plural', {n: 3},
                                       mockContext),
                         '33');
        });

        it('has a fallback', function() {
            assert.equal(l10n.ngettext('Does Not Exist {n}',
                                       'Plural Does Not Exist {n}', {n: 1},
                                       mockContext),
                         'Does Not Exist 1');
            assert.equal(l10n.ngettext('Does Not Exist {n}',
                                       'Plural Does Not Exist {n}', {n: 2},
                                       mockContext),
                         'Plural Does Not Exist 2');
        });

        it('accepts args', function() {
            assert.equal(l10n.ngettext('Plural {arg} String',
                                       'Plural {arg} Strings',
                                       {n: 1, arg: '45'},
                                       mockContext),
                         'Plurale El String');
            assert.equal(l10n.ngettext('Plural {arg} String',
                                       'Plural {arg} Strings',
                                       {n: 2, arg: '45'},
                                       mockContext),
                         'Plurale 45 Los Stringos');
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
                console.error(l10n.ngettext('Some String',
                                            'Some Plural String',
                                            {not_n: 1}, mockContext));
            } catch (e) {
                return done();
            }
            fail();
        });

        it('handles languages with no plurals', function() {
            mockContext.pluralize = function(n) {
                return n;
            };
            assert.equal(l10n.ngettext('My String', 'My Strings', {n: 1},
                                       mockContext),
                         'El String');
        });
    });
});
