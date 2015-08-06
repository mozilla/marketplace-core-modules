define('tests/format', ['core/format'], function(format) {

    describe('format', function() {
        it('formats a string by position', function() {
            assert.equal(format.format('{0}', ['zzz']), 'zzz');
        });

        it('formats a string by multiple position', function() {
            assert.equal(format.format('{0}foo{1}', 1, 2), '1foo2');
        });

        it('formats a string by name', function() {
            assert.equal(format.format('{x}', {x: 1}), '1');
        });

        it('formats a string by multiple names', function() {
            assert.equal(format.format('{x}foo{y}', {x: 1, y: 3}), '1foo3');
        });
    });

    describe('lazy format', function() {

        it('formats a string by position', function() {
            var str = '{0}';
            var lazy = {toString: function() { return str; }};
            var formatted = format.format(lazy, ['zzz']);
            str = 'xy{0}';
            assert.equal(formatted, 'xyzzz');
        });

        it('formats a string by multiple position', function() {
            var str = '{0}{1}';
            var lazy = {toString: function() { return str; }};
            var formatted = format.format(lazy, 1, 2);
            str = '{0}foo{1}';
            assert.equal(formatted, '1foo2');
        });

        it('formats a string by name', function() {
            var str = '{x}';
            var lazy = {toString: function() { return str; }};
            var formatted = format.format(lazy, {x: 1});
            str = '{x}yz';
            assert.equal(formatted, '1yz');
        });

        it('formats a string by multiple names', function() {
            var str = '{x}{y}';
            var lazy = {toString: function() { return str; }};
            var formatted = format.format(lazy, {x: 1, y: 3});
            str = '{x}foo{y}';
            assert.equal(formatted, '1foo3');
        });
    });
});
