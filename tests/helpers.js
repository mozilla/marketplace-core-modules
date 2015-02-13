define('tests/helpers',
    ['core/nunjucks', 'core/helpers'],
    function(nunjucks, helpers) {

    var filters = nunjucks.require('filters');

    describe('filters.datetime', function() {
        var d = new Date('2013-06-14T11:54:24');

        it('accepts a string', function() {
            // Test some timestamp in different types as argument.
            assert.equal(filters.datetime('2013-06-14T11:54:24'), d.toLocaleString());
        });

        it('accepts a date object', function() {
            // Test a `Date` type object as argument.
            assert.equal(filters.datetime(d), d.toLocaleString());
        });

        it('handles junk data', function() {
            // Test with junk arguments.
            assert.equal(filters.datetime(undefined), '');
            assert.equal(filters.datetime(null), '');
            assert.equal(filters.datetime('junk'), '');
        });
    });

    describe('filters.translate', function() {
        it('translate', function() {
            var dlobj = {'default_language': 'def_loc'};

            assert.equal(filters.translate('foobar', dlobj, 'en-CA'), 'foobar');
            assert.equal(filters.translate({'en-CA': 'foobar', 'en-US': 'us'}, dlobj, 'en-CA'),
                'foobar');
            assert.equal(filters.translate({'en': 'foobar', 'en-US': 'us'}, dlobj, 'en-CA'),
                'foobar');
            assert.equal(filters.translate({'blah': 'blah', 'bar': '1'}, 'bar', 'es-PD'), '1');
            assert.equal(filters.translate({'blah': 'blah', 'def_loc': '2'}, dlobj, 'es-PD'), '2');
            assert.equal(filters.translate({'blah': '3'}, dlobj, 'es-PD'), '3');
            assert.equal(filters.translate({'foo': 'bar', 'en-US': '3'}, null, 'es-PD'), '3');
            assert.equal(filters.translate({}, dlobj, 'es-PD'), '');
        });
    });
});
