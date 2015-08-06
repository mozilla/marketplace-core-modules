/* Python(ish) string formatting:
 * >>> format('{0}', ['zzz'])
 * "zzz"
 * >>> format('{0}{1}', 1, 2)
 * "12"
 * >>> format('{x}', {x: 1})
 * "1"
 */

define('core/format', [], function() {
    var re = /\{([^}]+)\}/g;

    function format(s, args) {
        if (!s) {
            throw "Format string is empty!";
        } else if (!args) {
            return;
        }
        if (!(args instanceof Array || args instanceof Object)) {
            args = Array.prototype.slice.call(arguments, 1);
        }
        var replace = function(str) {
            return str.replace(re, function(_, match){ return args[match]; });
        };
        if (typeof s === 'string') {
            // If we got a string format it now.
            return replace(s);
        } else {
            // If it isn't a string, it's probably a lazy string, be lazy.
            return {toString: function() { return replace(s.toString()); }};
        }
    }

    function template(s) {
        if (!s) {
            throw "Template string is empty!";
        }
        return function(args) { return format(s, args); };
    }

    return {
        format: format,
        template: template
    };
});
