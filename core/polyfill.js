define('core/polyfill', [], function() {
    // Polyfill `window.location.origin` (available in only FF 21+).
    var loc = window.location;
    if (!loc.origin) {
        loc.origin = loc.protocol + '//' + loc.host;
    }

    // Polyfill `window.performance.now`
    // (available in only IE 10+, FF 15+, Chrome 20+, PhantomJS 2).
    if (!window.performance) {
        window.performance = {};
    }
    if (!window.performance.now) {
        window.performance.now = function() {
            // Avoid using `Date.now` for IE 8 and lower.
            return +new Date();
        };
    }

    // IE Custom Event polyfill.
    CustomEvent = function(event, params) {
        params = params || {};
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable,
                            params.detail);
        return evt;
    };
});
