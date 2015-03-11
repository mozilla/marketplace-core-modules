// Test locale file.
(function() {
    if (!navigator.l10n) {
        navigator.l10n = {};
    }
    navigator.l10n.language = 'es';
    navigator.l10n.strings = {
        'Test': {'body': 'Testo'}
    };
})();
