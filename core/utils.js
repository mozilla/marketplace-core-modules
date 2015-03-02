define('core/utils',
    ['core/l10n', 'jquery', 'underscore'],
    function(l10n, $, _) {
    'use strict';

    var ngettext = l10n.ngettext;
    // This is a circular dependency.
    function log(msg) {
        require('core/log')('utils').log(msg);
    }

    _.extend(String.prototype, {
        strip: function(str) {
            // Strip all whitespace.
            return this.replace(/\s/g, '');
        }
    });

    function _pd(func) {
        return function(e) {
            e.preventDefault();
            if (func) {
                func.apply(this, arguments);
            }
        };
    }

    // Initializes character counters for textareas.
    function initCharCount() {
        var countChars = function(el, cc) {
            var $el = $(el);
            var max = parseInt($el.attr('maxlength'), 10);
            var left = max - $el.val().length;
            // L10n: {n} is the number of characters left.
            cc.html(ngettext('<b>{n}</b> character left.',
                             '<b>{n}</b> characters left.', {n: left}))
              .toggleClass('error', left < 0);
        };
        $('.char-count').each(function() {
            var $cc = $(this);
            $cc.closest('form')
               .find('#' + $cc.data('for'))
               // Note 'input' event is need for FF android see (bug 976262)
               .on('input blur', _.throttle(function() {countChars(this, $cc);}, 250))
               .trigger('blur');
        });
    }

    function slugify(s, limit) {
        if (typeof s !== 'string') {
            return s;
        }
        var value = s.toLowerCase().trim()
                     .replace(/[ _]/g, '-')
                     .replace(/[^-\w]/g, '')
                     .replace(/-+/g, '-');
        if (limit) {
            value = value.substr(0, limit);  // Cap the slug length.
        }
        return value;
    }

    var tags = /input|keygen|meter|option|output|progress|select|textarea/i;
    function fieldFocused(e) {
        return tags.test(e.target.nodeName);
    }

    function querystring(url) {
        var qpos = url.indexOf('?');
        if (qpos === -1) {
            return {};
        } else {
            return getVars(url.substr(qpos + 1));
        }
    }

    function baseurl(url) {
        return url.split('?')[0];
    }

    function bgurl(url) {
        return 'url(' + JSON.stringify(url) + ')';
    }

    function encodeURIComponent(uri) {
        return window.encodeURIComponent(uri).replace(/%20/g, '+');
    }

    function decodeURIComponent(uri) {
        return window.decodeURIComponent(uri.replace(/\+/g, ' '));
    }

    function urlencode(kwargs) {
        if (typeof kwargs === 'string') {
            return encodeURIComponent(kwargs);
        }
        var params = [];
        if ('__keywords' in kwargs) {
            delete kwargs.__keywords;
        }
        var keys = _.keys(kwargs).sort();
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = kwargs[key];
            if (value === undefined) {
                params.push(encodeURIComponent(key));
            } else {
                params.push(encodeURIComponent(key) + '=' +
                            encodeURIComponent(value));
            }
        }
        return params.join('&');
    }

    function urlparams(url, kwargs) {
        return baseurl(url) + '?' + urlencode(_.defaults(kwargs, querystring(url)));
    }

    function urlunparam(url, params) {
        var qs = querystring(url);
        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            if (!(p in qs)) {
                continue;
            }
            delete qs[p];
        }
        var base = baseurl(url);
        if (_.isEmpty(qs)) {
            return base;
        }
        return base + '?' + urlencode(qs);
    }

    function getVars(qs, excl_undefined) {
        if (!qs) {
            qs = location.search;
        }
        if (!qs || qs === '?') {
            return {};
        }
        if (qs && qs[0] == '?') {
            // Filter off the leading ? if it's there.
            qs = qs.substr(1);
        }

        // ['a=b', 'c=d']
        return _.chain(qs.split('&'))
                // [['a', 'b'], ['c', 'd']].
                .map(function(c) {return c.split('=').map(decodeURIComponent);})
                // [['a', 'b'], ['c', undefined]] -> [['a', 'b']]
                .filter(function(p) {
                    return !!p[0] && (!excl_undefined || !_.isUndefined(p[1]));
                // {'a': 'b', 'c': 'd'}
                }).object()
                .value();
    }

    function translate(data, default_language, lang) {
        if (!data) {
            return '';
        }
        if (typeof data === 'string') {
            return data;
        }
        // TODO: Make this a setting somewhere.
        default_language = default_language || 'en-US';
        lang = lang || (window.navigator.l10n ?
                        window.navigator.l10n.language : 'en-US');
        if (lang in data) {
            return data[lang];
        }
        var short_lang = lang.split('-')[0];
        if (short_lang in data) {
            return data[short_lang];
        }
        if (typeof default_language === 'string') {
            return data[default_language];
        } else if (typeof default_language === 'object' &&
                   'default_language' in default_language &&
                   default_language.default_language in data) {
            return data[default_language.default_language];
        }
        for (var x in data) { return data[x]; }
        return '';
    }

    var a = document.createElement('a');

    function urlparse(url) {
        a.href = url;
        return a;
    }

    function getCenteredCoordinates(width, height) {
        var x = window.screenX + Math.max(0, Math.floor((window.innerWidth - width) / 2));
        var y = window.screenY + Math.max(0, Math.floor((window.innerHeight - height) / 2));
        return [x, y];
    }

    function openWindow(opts) {
        opts = opts || {};
        var url = opts.url || '';
        var title = opts.title || 'fxa';
        var w = opts.width || 320;
        var h = opts.height || 600;
        var centerCoords = getCenteredCoordinates(w, h);
        return window.open(url, title,
            'scrollbars=yes,width=' + w + ',height=' + h +
            ',left=' + centerCoords[0] + ',top=' + centerCoords[1]);
    }

    function isSystemDateRecent() {
        var rval = new Date().getFullYear() >= 2010;
        if (!rval) {
            log('System date appears to be incorrect!');
        }
        return rval;
    }

    function lang() {
        return (navigator.l10n && navigator.l10n.language) ||
            navigator.language ||
            navigator.userLanguage;
    }


    return {
        '_pd': _pd,
        'baseurl': baseurl,
        'bgurl': bgurl,
        'encodeURIComponent': encodeURIComponent,
        'decodeURIComponent': decodeURIComponent,
        'escape_': _.escape,
        'fieldFocused': fieldFocused,
        'getVars': getVars,
        'initCharCount': initCharCount,
        'isSystemDateRecent': isSystemDateRecent,
        'lang': lang,
        'openWindow': openWindow,
        'querystring': querystring,
        'slugify': slugify,
        'urlencode': urlencode,
        'urlparams': urlparams,
        'urlparse': urlparse,
        'urlunparam': urlunparam,
        'translate': translate
    };

});
