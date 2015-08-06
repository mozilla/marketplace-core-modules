/*
    Localization module.

    Exposes gettext and ngettext functions that look up a string in the
    window.navigator.l10n object to find the appropriate translation. The
    window.navigator.l10n object is populated by l10n_init.js, which detects
    the user's locale and injects a script tag with the locale .po file.

    l10n_init.js and this l10n.js module used to be one file which ended up
    being requested twice. It has since been split.
*/
define('core/l10n',
    ['core/format'],
    function(format) {
    var RTL_LIST = ['ar', 'he', 'fa', 'ps', 'rtl', 'ur'];

    function get(str, args, context) {
        // Look up the string given the ID.
        context = context || navigator;
        var out;
        if (context.l10n && context.l10n.strings) {
            out = context.l10n.strings[str] || str;
        } else {
            return str;
        }
        if (args) {
            out = format.format(out, args);
        }
        return out;
    }

    function get_lazy(str, args, context) {
        return {
            toString: function() {
                return get(str, args, context);
            },
        };
    }

    function nget(str, plural, args, context) {
        // Look up a plural string given the ID and number.
        context = context || navigator;
        if (!args || !('n' in args)) {
            throw new Error('`n` not passed to ngettext');
        }
        var out;
        var n = args.n;
        var strings;
        var fallback = n === 1 ? str : plural;
        if (context.l10n && context.l10n.strings &&
            str in (strings = context.l10n.strings)) {
            if (strings[str].constructor === Array && strings[str].length) {
                // +true is 1 / +false is 0
                var plid = +context.l10n.pluralize(n);
                out = strings[str][plid] || fallback;
            } else {
                // Support languages like zh-TW which have no plural form.
                out = strings[str] || fallback;
            }
        } else {
            out = fallback;
        }
        return format.format(out, args);
    }

    window.gettext = get;
    window.ngettext = nget;

    return {
        getDirection: function(context) {
            // Try to get browser language, if undefined use default locale.
            var language;
            if (context) {
                language = context.language;
            } else {
                language = window.navigator.l10n ? window.navigator.l10n.language :
                                                  'en-US';
            }
            if (language.indexOf('-') > -1) {
                language = language.split('-')[0];
            }
            // http://www.w3.org/International/questions/qa-scripts
            // Arabic, Hebrew, Farsi, Pashto, Urdu
            return RTL_LIST.indexOf(language) >= 0 ? 'rtl' : 'ltr';
        },
        gettext: get,
        gettext_lazy: get_lazy,
        ngettext: nget,
    };
});
