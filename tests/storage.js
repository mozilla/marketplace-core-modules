define('tests/storage',
    ['core/storage', 'underscore'],
    function(storage, _) {

    describe('storage', function() {
        it('returns proper types', function(done) {
            storage.setItem('number', 4);
            assert.strictEqual(storage.getItem('number'), 4);
            storage.removeItem('number');

            storage.setItem('string', 'abcde');
            assert.strictEqual(storage.getItem('string'), 'abcde');
            storage.removeItem('string');

            storage.setItem('boolean', true);
            assert.strictEqual(storage.getItem('boolean'), true);
            storage.removeItem('boolean');

            storage.setItem('array', [1, 2, 3, 4, 5]);
            assert(Array.isArray(storage.getItem('array')));
            assert(_.isEqual(storage.getItem('array'), [1,2,3,4,5]));
            storage.removeItem('array');

            storage.setItem('object', {a: 1, b: 2, c: 3});
            assert.strictEqual(typeof storage.getItem('object'), 'object');
            assert(_.isEqual(storage.getItem('object'), {a: 1, b: 2, c: 3}));
            storage.removeItem('object');

            done();
        });

        it('can get and set items', function(done) {
            storage.setItem('test', 123);
            assert.strictEqual(storage.getItem('test'), 123);
            done();
        });

        it('can remove items', function(done) {
            var key = 'transient';
            var value = {
                unix: '30 definitions of regular expressions living under ' +
                      'one roof',
                windows: 'has detected the mouse has moved. Please restart ' +
                         'your system for changes to take effect',
                beos: 'These three are certain:/Death, taxes, and site not ' +
                      'found./You, victim of one.'
            };
            assert.strictEqual(storage.getItem(key), null);
            storage.setItem(key, value);
            assert(_.isEqual(storage.getItem(key), value));
            storage.removeItem(key);
            assert.strictEqual(storage.getItem(key), null);
            done();
        });
    });
});
