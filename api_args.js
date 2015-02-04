define('api_args', ['underscore'], function(_) {
    var processors = [];
    var exports = function(endpoint) {
        return _.reduce(processors, function(memo, processor) {
            return _.extend(memo, processor(endpoint));
        }, {});
    };
    exports.addProcessor = function(processor) { processors.push(processor); };
    exports.clearProcessors = function() { processors = []; };
    return exports;
});
