/*
    A script that initializes l10n. This must be done before the consuming app
    is initialized because we want to have l10n set up so translations load
    correctly. A promise is exposed to be further exposed by core/init.

    - Uses the list of languages passed in by Zamboni and set on body to
      determine whether we support that locale / have a script for that locale.
    - Injects script tag for the locale file respective of the user's language.
    - If locale file 404s, then it falls back to en-US.
    - Falling back to en-US leads to trying to load en-US.js. If that fails,
      then we manually set window.navigator.l10n.
    - Injected script tag is a JS file that sets window.navigator.l10n with
      a locale obj populated with a script via .po files.
    - The promise resolves once the locale script loads (or errors).
*/
define('core/l10n_init',
    ['core/defer', 'core/l10n', 'core/z'],
    function(defer, l10n, z) {
    var languages;
    var bodyLangs = document.body.getAttribute('data-languages');
    if (bodyLangs) {
        languages = JSON.parse(bodyLangs);
    } else {
        languages = [
            'ar', 'bg', 'bn-BD', 'ca', 'cs', 'da', 'de', 'el', 'en-US', 'es',
            'eu', 'fr', 'ga-IE', 'hr', 'hu', 'it', 'ja', 'ko', 'mk', 'nb-NO',
            'nl', 'pa', 'pl', 'pt-BR', 'ro', 'rtl', 'ru', 'sk', 'sq', 'sr',
            'sr-Latn', 'ta', 'tr', 'xh', 'zh-CN', 'zh-TW', 'zu', 'dbg'
        ];
    }

    function injectLocaleScript(l10nInitialized, locale) {
        // Inject script to load locale file that populates w.navigator.1l0n.
        // If locale script 404s, fall back to en-US.
        l10nInitialized = l10nInitialized || defer.Deferred();
        locale = locale || getLocale();

        var script = document.createElement('script');
        script.src = getLocaleSrc(locale);
        script.onload = function() {
            // Add html[dir].
            document.documentElement.setAttribute('dir', l10n.getDirection());
            document.documentElement.setAttribute('lang', locale);
            l10nInitialized.resolve(locale, script);
        };
        script.onerror = function() {
            // If locale file not found, then fall back English (bug 1044195).
            if (locale == 'en-US') {
                // If we are falling back and it still errors, just resolve.
                window.navigator.l10n = {
                    language: 'en-US'
                };
                l10nInitialized.resolve('en-US', script);
            } else {
                // Fall back to en-US by trying to load the en-US locale.
                injectLocaleScript(l10nInitialized, 'en-US');
            }
        };
        document.body.appendChild(script);

        return l10nInitialized;
    }

    function _transformLocale(locale) {
        // Use default locale "en-US" if given locale is undefined.
        locale = locale || 'en-US';
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
        languages: languages,
    };
});
