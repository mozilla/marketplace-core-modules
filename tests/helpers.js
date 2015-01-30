define('tests/helpers',
        ['assert', 'nunjucks', 'helpers'],
        function(a, nunjucks, helpers) {
    var eq_ = a.eq_;
    var filters = nunjucks.require('filters');

    describe('filters.datetime', function() {
        var d = new Date('2013-06-14T11:54:24');

        it('accepts a string', function() {
            // Test some timestamp in different types as argument.
            eq_(filters.datetime('2013-06-14T11:54:24'), d.toLocaleString());
        });

        it('accepts a date object', function() {
            // Test a `Date` type object as argument.
            eq_(filters.datetime(d), d.toLocaleString());
        });

        it('handles junk data', function() {
            // Test with junk arguments.
            eq_(filters.datetime(undefined), '');
            eq_(filters.datetime(null), '');
            eq_(filters.datetime('junk'), '');
        });
    });

    describe('filters.translate', function() {
        it('translate', function() {
            var dlobj = {'default_language': 'def_loc'};

            eq_(filters.translate('foobar', dlobj, 'en-CA'), 'foobar');
            eq_(filters.translate({'en-CA': 'foobar', 'en-US': 'us'}, dlobj, 'en-CA'),
                'foobar');
            eq_(filters.translate({'en': 'foobar', 'en-US': 'us'}, dlobj, 'en-CA'),
                'foobar');
            eq_(filters.translate({'blah': 'blah', 'bar': '1'}, 'bar', 'es-PD'), '1');
            eq_(filters.translate({'blah': 'blah', 'def_loc': '2'}, dlobj, 'es-PD'), '2');
            eq_(filters.translate({'blah': '3'}, dlobj, 'es-PD'), '3');
            eq_(filters.translate({'foo': 'bar', 'en-US': '3'}, null, 'es-PD'), '3');
            eq_(filters.translate({}, dlobj, 'es-PD'), '');
        });
    });
});
