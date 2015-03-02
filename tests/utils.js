define('tests/utils',
    ['core/nunjucks', 'core/helpers', 'core/utils', 'core/log'],
    function(nunjucks, helpers, utils, log) {

    describe('utils', function() {
        it('String strip', function() {
            assert.equal(('  a s d  f   ').strip(), 'asdf');
        });

        it('_pd', function(done) {
            var ev = {preventDefault: done};
            utils._pd(function() {})(ev);
        });

        it('escape_', function() {
            assert.equal(utils.escape_('<b> & "\'<'), '&lt;b&gt; &amp; &quot;&#x27;&lt;');
        });

        it('slugify', function() {
            assert.equal(utils.slugify(null), null);
            assert.equal(utils.slugify(undefined), undefined);
            assert.equal(utils.slugify(''), '');
            assert.equal(utils.slugify(' '), '');
            assert.equal(utils.slugify(' - '), '-');
            assert.equal(utils.slugify('<b> & "\'<'), 'b-');
            assert.equal(utils.slugify('42'), '42');
            assert.equal(utils.slugify('4 & square™'), '4-square');

            assert.equal(utils.slugify('xx x  - "#$@ x'), 'xx-x-x');
            assert.equal(utils.slugify('Bän...g (bang)'), 'bng-bang');
            assert.equal(utils.slugify('Ελληνικά'), '');
            assert.equal(utils.slugify('    a '), 'a');
            assert.equal(utils.slugify('tags/'), 'tags');
            assert.equal(utils.slugify('holy_wars'), 'holy-wars');
            assert.equal(utils.slugify('x荿'), 'x');
            assert.equal(utils.slugify('ϧ΃蒬蓣'), '');
            assert.equal(utils.slugify('¿x'), 'x');
        });

        it('fieldFocused', function() {
            assert.equal(utils.fieldFocused({target: {nodeName: 'input'}}), true);
            assert.equal(utils.fieldFocused({target: {nodeName: 'bgsound'}}), false);
        });

        it('querystring', function() {
            assert.deepEqual(utils.querystring('?a=b&c=d'), {a: 'b', c: 'd'});
            assert.deepEqual(utils.querystring('asdfoobar?a=b&c=d'), {a: 'b', c: 'd'});
            assert.deepEqual(utils.querystring('?a=b&a=d'), utils.getVars('a=b&a=d'));
            assert.deepEqual(utils.querystring('?a=foo%2Bbar'), {a: 'foo+bar'});  // bug 905536
        });

        it('baseurl', function() {
            assert.equal(utils.baseurl('http://foo/bar'), 'http://foo/bar');
            assert.equal(utils.baseurl('http://foo/bar?asdf/asdf'), 'http://foo/bar');
            assert.equal(utils.baseurl('http://foo/bar/?asdf/asdf'), 'http://foo/bar/');
        });

        it('bgurl', function() {
            assert.equal(utils.bgurl('http://foo/bar/seavan.png'),
                'url("http://foo/bar/seavan.png")');
            assert.equal(utils.bgurl("http://foo/bar/Sea 'Seavan' Van.png"),
                'url("http://foo/bar/Sea \'Seavan\' Van.png")');
        });

        it('urlencode', function() {
            assert.equal(utils.urlencode({a: 'b'}), 'a=b');
            assert.equal(utils.urlencode({a: 'b', c: 'd'}), 'a=b&c=d');
            assert.equal(utils.urlencode({c: 'b', a: 'd'}), 'a=d&c=b');  // Must be alphabetized.
            assert.equal(utils.urlencode({__keywords: 'poop', test: 'crap'}), 'test=crap');
            assert.equal(utils.urlencode({test: 'cr ap'}), 'test=cr+ap');
            assert.equal(utils.urlencode({foo: void 0, zap: 0}), 'foo&zap=0');
        });

        it('urlparams', function() {
            assert.equal(utils.urlparams('', {a: 'b'}), '?a=b');
            assert.equal(utils.urlparams('?', {a: 'b'}), '?a=b');
            assert.equal(utils.urlparams('?', {a: ' '}), '?a=+');
            assert.equal(utils.urlparams('?a=d', {a: 'b'}), '?a=b');
        });

        it('urlunparam', function() {
            assert.equal(utils.urlunparam('foo/bar?a=1&b=2&c=3', ['']), 'foo/bar?a=1&b=2&c=3');
            assert.equal(utils.urlunparam('foo/bar?a=1&b=2&c=3', ['d']), 'foo/bar?a=1&b=2&c=3');
            assert.equal(utils.urlunparam('foo/bar?a=1&b=2&c=3', ['b']), 'foo/bar?a=1&c=3');
            assert.equal(utils.urlunparam('foo/bar?a&b&c=3', ['b']), 'foo/bar?a&c=3');
            assert.equal(utils.urlunparam('foo/bar?b=1', ['b']), 'foo/bar');
        });

        it('getVars', function() {
            assert.deepEqual(utils.getVars('a=b'), {a: 'b'});
            assert.deepEqual(utils.getVars('a=b+c'), {a: 'b c'});
            assert.deepEqual(utils.getVars('a%20z=b%20c'), {'a z': 'b c'});
            assert.deepEqual(utils.getVars('a+z=b+c'), {'a z': 'b c'});
            assert.deepEqual(utils.getVars('?a=b'), {a: 'b'});
            assert.deepEqual(utils.getVars('?'), {});
            assert.deepEqual(utils.getVars('?a=b&c=d'), {a: 'b', c: 'd'});
            // Test that there's not weird HTML encoding going on.
            assert.deepEqual(utils.getVars('%3C%3E%22\'%26=%3C%3E%22\'%26'),
                {'<>"\'&': '<>"\'&'});
        });

        it('isSystemDateRecent', function() {
            assert.equal(utils.isSystemDateRecent(), true);

            // Backdate `Date` for testing.
            var _Date = window.Date;
            var d = new Date(2000, 1, 1);
            window.Date = function() {
                return d;
            };
            // For `Date.now` (and `jquery.now`) to work.
            window.Date.now = function() {
                return d.getTime();
            };

            assert.equal(utils.isSystemDateRecent(), false);

            // It should have logged something.
            assert.include(log.logs.utils[0],
                       '[utils] System date appears to be incorrect!');

            // Put back date.
            window.Date = _Date;
        });
    });
});
