/*
    Implementations and utils for for console logging.
    Notably, it stores logs for later reference.
*/
define('core/log',
    ['core/storage', 'core/utils'],
    function(storage, utils) {
    'use strict';

    if (window.console.groupCollapsed === undefined) {
        // If conslole group API not available. Use log instead.
        window.console.groupCollapsed = window.console.log;
        window.console.group = window.console.log;
        window.console.groupEnd = function() {};
    }

    var slice = Array.prototype.slice;
    var filter;
    var logs;
    var all_logs = [];

    var persistent_logs = storage.getItem('persistent_logs') || {};

    var logger = function(type, tag, onlog) {
        // Give nice log prefixes:
        // > [log] This is a nice message!
        var prefix = '[' + type + ']';

        // If we have a tag, add that on:
        // > [log][special] Special messages!
        if (tag) {
            prefix += '[' + tag + ']';
        }
        prefix += ' ';

        if (!(type in logs)) {
            logs[type] = [];
        }

        var log_queue = logs[type];

        function make(log_level) {
            return function() {
                var args = slice.call(arguments, 0);
                if (args.length) {
                    args[0] = prefix + args[0];
                    args = args.map(filter);
                    log_queue.push(args);
                    all_logs.push(args);
                    if (onlog) {
                        onlog(args);
                    }
                }

                if (window.console[log_level] === undefined) {
                    // Firefox Nightly refusing the polyfill above.
                    window.console[log_level] = window.console.log;
                }

                // TODO: Add colorification here for browsers that support it.
                // *cough cough* not firefox *cough*
                window.console[log_level].apply(window.console, args);
            };
        }

        return {
            log: make('log'),
            warn: make('warn'),
            error: make('error'),

            group: make('group'),
            groupCollapsed: make('groupCollapsed'),
            groupEnd: make('groupEnd'),

            // Have log('payments') but want log('payments', 'mock')?
            // log('payments').tagged('mock') gives you the latter.
            tagged: function(newTag) {
                return logger(type, tag + '][' + newTag, onlog);
            }
        };
    };

    logger.unmentionables = [];
    logger.unmention = function(term) {
        logger.unmentionables.push(term);
        logger.unmentionables.push(utils.encodeURIComponent(term));
    };

    logs = logger.logs = {};
    logger.all = all_logs;
    logger.get_recent = function(count, type) {
        var selected_logs = type ? logs[type] : all_logs;
        var length = selected_logs.length;
        return selected_logs.slice(Math.max(length - count, 0), length);
    };

    filter = logger.filter = function(data) {
        if (typeof data !== 'string') {
            return data;
        }
        for (var i = 0; i < logger.unmentionables.length; i++) {
            data = data.replace(logger.unmentionables[i], '---');
        }
        return data;
    };

    logger.persistent = function(type) {
        var args = slice.call(arguments);
        args[2] = function(log_args) {
            if (!(type in persistent_logs)) {
                persistent_logs[type] = [];
            }
            persistent_logs[type].push(log_args);
            storage.setItem('persistent_logs', persistent_logs);
        };
        return logger.apply(this, args);
    };
    logger.persistent.all = persistent_logs;

    return logger;
});
