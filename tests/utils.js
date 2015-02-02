import a from 'assert';
import nunjucks from 'nunjucks';
import helpers from 'helpers';
import utils from 'utils';
import log from 'log';

var assert = a.assert;
var eq_ = a.eq_;
var feq_ = a.feq_;

describe('utils', function() {
    it('String strip', function() {
        eq_(('  a s d  f   ').strip(), 'asdf');
    });

    it('_pd', function(done) {
        var ev = {preventDefault: done};
        utils._pd(function() {})(ev);
    });

    it('escape_', function() {
        eq_(utils.escape_('<b> & "\'<'), '&lt;b&gt; &amp; &quot;&#x27;&lt;');
    });

    it('slugify', function() {
        eq_(utils.slugify(null), null);
        eq_(utils.slugify(undefined), undefined);
        eq_(utils.slugify(''), '');
        eq_(utils.slugify(' '), '');
        eq_(utils.slugify(' - '), '-');
        eq_(utils.slugify('<b> & "\'<'), 'b-');
        eq_(utils.slugify('42'), '42');
        eq_(utils.slugify('4 & square™'), '4-square');

        eq_(utils.slugify('xx x  - "#$@ x'), 'xx-x-x');
        eq_(utils.slugify('Bän...g (bang)'), 'bng-bang');
        eq_(utils.slugify('Ελληνικά'), '');
        eq_(utils.slugify('    a '), 'a');
        eq_(utils.slugify('tags/'), 'tags');
        eq_(utils.slugify('holy_wars'), 'holy-wars');
        eq_(utils.slugify('x荿'), 'x');
        eq_(utils.slugify('ϧ΃蒬蓣'), '');
        eq_(utils.slugify('¿x'), 'x');
    });

    it('fieldFocused', function() {
        eq_(utils.fieldFocused({target: {nodeName: 'input'}}), true);
        eq_(utils.fieldFocused({target: {nodeName: 'bgsound'}}), false);
    });

    it('querystring', function() {
        feq_(utils.querystring('?a=b&c=d'), {a: 'b', c: 'd'});
        feq_(utils.querystring('asdfoobar?a=b&c=d'), {a: 'b', c: 'd'});
        feq_(utils.querystring('?a=b&a=d'), utils.getVars('a=b&a=d'));
        feq_(utils.querystring('?a=foo%2Bbar'), {a: 'foo+bar'});  // bug 905536
    });

    it('baseurl', function() {
        eq_(utils.baseurl('http://foo/bar'), 'http://foo/bar');
        eq_(utils.baseurl('http://foo/bar?asdf/asdf'), 'http://foo/bar');
        eq_(utils.baseurl('http://foo/bar/?asdf/asdf'), 'http://foo/bar/');
    });

    it('bgurl', function() {
        eq_(utils.bgurl('http://foo/bar/seavan.png'),
            'url("http://foo/bar/seavan.png")');
        eq_(utils.bgurl("http://foo/bar/Sea 'Seavan' Van.png"),
            'url("http://foo/bar/Sea \'Seavan\' Van.png")');
    });

    it('urlencode', function() {
        eq_(utils.urlencode({a: 'b'}), 'a=b');
        eq_(utils.urlencode({a: 'b', c: 'd'}), 'a=b&c=d');
        eq_(utils.urlencode({c: 'b', a: 'd'}), 'a=d&c=b');  // Must be alphabetized.
        eq_(utils.urlencode({__keywords: 'poop', test: 'crap'}), 'test=crap');
        eq_(utils.urlencode({test: 'cr ap'}), 'test=cr+ap');
        eq_(utils.urlencode({foo: void 0, zap: 0}), 'foo&zap=0');
    });

    it('urlparams', function() {
        eq_(utils.urlparams('', {a: 'b'}), '?a=b');
        eq_(utils.urlparams('?', {a: 'b'}), '?a=b');
        eq_(utils.urlparams('?', {a: ' '}), '?a=+');
        eq_(utils.urlparams('?a=d', {a: 'b'}), '?a=b');
    });

    it('urlunparam', function() {
        eq_(utils.urlunparam('foo/bar?a=1&b=2&c=3', ['']), 'foo/bar?a=1&b=2&c=3');
        eq_(utils.urlunparam('foo/bar?a=1&b=2&c=3', ['d']), 'foo/bar?a=1&b=2&c=3');
        eq_(utils.urlunparam('foo/bar?a=1&b=2&c=3', ['b']), 'foo/bar?a=1&c=3');
        eq_(utils.urlunparam('foo/bar?a&b&c=3', ['b']), 'foo/bar?a&c=3');
        eq_(utils.urlunparam('foo/bar?b=1', ['b']), 'foo/bar');
    });

    it('getVars', function() {
        feq_(utils.getVars('a=b'), {a: 'b'});
        feq_(utils.getVars('a=b+c'), {a: 'b c'});
        feq_(utils.getVars('a%20z=b%20c'), {'a z': 'b c'});
        feq_(utils.getVars('a+z=b+c'), {'a z': 'b c'});
        feq_(utils.getVars('?a=b'), {a: 'b'});
        feq_(utils.getVars('?'), {});
        feq_(utils.getVars('?a=b&c=d'), {a: 'b', c: 'd'});
        // Test that there's not weird HTML encoding going on.
        feq_(utils.getVars('%3C%3E%22\'%26=%3C%3E%22\'%26'),
            {'<>"\'&': '<>"\'&'});
    });

    it('isSystemDateRecent', function() {
        eq_(utils.isSystemDateRecent(), true);

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

        eq_(utils.isSystemDateRecent(), false);

        // It should have logged something.
        a.contains(log.logs.utils[0],
                    '[utils] System date appears to be incorrect!');

        // Put back date.
        window.Date = _Date;
    });
});
