/*
    A script that initializes l10n before include.js is loaded. Require this
    before your main JS bundle.

    Injects script tag for the locale file respective of the user's language.
    The injected script tag is a JS file that sets window.navigator.l10n with
    a locale obj populated with a script via .po files.
    Should be minified in the build step and copied into the project's JS root.

    This file is then served by Zamboni in mkt/commonplace, looking inside the
    project's media root.
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.l10n_init = factory();
    }
}(this, function() {
    var languages;
    var bodyLangs = document.body.getAttribute('data-languages');
    if (bodyLangs) {
        languages = JSON.parse(bodyLangs);
    } else {
        languages = [
            'bg', 'bn-BD', 'ca', 'cs', 'da', 'de', 'el', 'en-US', 'es', 'eu',
            'fr', 'ga-IE', 'hr', 'hu', 'it', 'ja', 'ko', 'mk', 'nb-NO', 'nl',
            'pa', 'pl', 'pt-BR', 'ro', 'ru', 'sk', 'sq', 'sr', 'sr-Latn', 'ta',
            'tr', 'xh', 'zh-CN', 'zh-TW', 'zu', 'dbg'
        ];
    }
    injectLocaleScript();

    function injectLocaleScript(_testLocale) {
        // Inject script to load locale file that populates w.navigator.1l0n.
        var script = document.createElement('script');
        script.src = getLocaleSrc(_testLocale || getLocale());
        script.onerror = function() {
            // If locale file not found, then fallback English (bug 1044195).
            window.navigator.l10n = {
                language: 'en-US'
            };
        };
        document.body.appendChild(script);
        return script;
    }

    function _transformLocale(locale) {
        // If it's in the list of locales, return it.
        if (languages.indexOf(locale) !== -1) {
            return locale;
        }

        // If the prefix is in the list locales, return the prefix.
        locale = locale.split('-')[0];
        if (languages.indexOf(locale) !== -1) {
            return locale;
        }

        // Expand locale with language suffix.
        var langExpander = {
            'en': 'en-US', 'ga': 'ga-IE', 'pt': 'pt-BR', 'sv': 'sv-SE',
            'zh': 'zh-CN', 'sr': 'sr-Latn'
        };
        if (locale in langExpander) {
            locale = langExpander[locale];
            if (languages.indexOf(locale) !== -1) {
                return locale;
            }
        }
        return 'en-US';
    }

    function getLocale(_testLocale) {
        // Returns the user's detected locale.
        var qsLang = /[\?&]lang=([\w\-]+)/i.exec(window.location.search);
        var locale = _transformLocale(_testLocale ||
                                      (qsLang && qsLang[1]) ||
                                      window.navigator.language ||
                                      window.navigator.userLanguage);
        if (locale === 'en-US') {
            // Still pull English locale since translation doesn't necessarily
            // always match gettext key (e.g., Feed brand).
            // So don't return here yet; we may need the English locale file.
            window.navigator.l10n = {
                language: 'en-US'
            };
        }
        return locale;
    }

    function getLocaleSrc(locale, _testDoc) {
        var doc = _testDoc || window.document;

        // Returns URL from where to load the appropriate JS locale file.
        // For website, we need the CDN URL.
        // If packaged, don't want the extra network request. Fortunately,
        // data-media not set in packaged so it will load from the package.
        var media_url = doc.body.getAttribute('data-media');

        // If build ID, use for cachebusting. Else, in packaged app in don't
        // care.
        var buildId = doc.body.getAttribute('data-build-id-js');
        var repo = doc.body.getAttribute('data-repo');
        return [
            media_url || '/media/',
            repo ? repo + '/' : '',
            'locales/' + locale + '.js',
            buildId ? '?b=' + buildId : ''
        ].join('');
    }

    return {
        // Export mostly to unit test.
        getLocale: getLocale,
        getLocaleSrc: getLocaleSrc,
        injectLocaleScript: injectLocaleScript,
        languages: languages
    };
}));
