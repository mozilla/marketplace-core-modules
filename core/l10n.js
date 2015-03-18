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
    var RTL_LIST = ['ar', 'he', 'fa', 'ps', 'ur'];

    function get(str, args, context) {
        context = context || navigator;
        var out;
        if (context.l10n && context.l10n.strings &&
            str in context.l10n.strings) {
            out = context.l10n.strings[str].body || str;
        } else {
            out = str;
        }
        if (args) {
            out = format.format(out, args);
        }
        return out;
    }

    function nget(str, plural, args, context) {
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
            if (strings[str].plurals) {
                // +true is 1 / +false is 0
                var plid = +context.l10n.pluralize(n);
                out = strings[str].plurals[plid] || fallback;
            } else {
                // Support languages like zh-TW which have no plural form.
                out = strings[str].body || fallback;
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
            var language = context ? context.language :
                                     window.navigator.l10n.language;
            if (language.indexOf('-') > -1) {
                language = language.split('-')[0];
            }
            // http://www.w3.org/International/questions/qa-scripts
            // Arabic, Hebrew, Farsi, Pashto, Urdu
            return RTL_LIST.indexOf(language) >= 0 ? 'rtl' : 'ltr';
        },
        gettext: get,
        ngettext: nget,
    };
});
