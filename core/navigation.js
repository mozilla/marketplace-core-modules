define('core/navigation',
    ['core/capabilities', 'core/l10n', 'core/log', 'core/notification',
     'core/scroll_state', 'core/settings', 'core/utils', 'core/views',
     'core/z', 'underscore'],
    function(capabilities, l10n, log, notification,
             scroll_state, settings, utils, views, z, _) {
    'use strict';
    var gettext = l10n.gettext;
    var logger = log('navigation');

    var stack = [  // Internal object.
        {path: '/', type: 'root'}
    ];
    var initialized = false;


    function navigate(href, isPopping, state) {
        /* Start navigation.
           href -- URL to navigate to
           isPopping -- whether going back/forward in the browser w/ pushState
           state -- the new state we are navigating to
        */
        if (!state) {
            return;
        }

        var viewData = views.match(href);
        var viewPromise = viewData[0];
        var args = viewData[1];
        if (viewPromise === null) {
            logger.warn('Unable to resolve route to a view');
            return;
        }

        if (!args && initialized) {
            window.location.href = href;
            return;
        }

        logger.log('Navigation started: ', href);

        // Wait for the view to load, then finish updating.
        viewPromise.done(function(view) {
            updateView(view, args, href, isPopping, state);
        });
    }

    function updateView(view, args, href, isPopping, state) {
        if (isPopping) {
            z.page.trigger('navigation--pop-state', [state]);
        }

        if (initialized) {
            // Call navigating before the view build function so that modules
            // the view depend on can react in time.
            z.win.trigger('navigating', [isPopping]);
        }

        views.build(view, args, state.params);
        initialized = true;
        state.type = z.context.type;
        state.title = z.context.title;

        // Clean the path's parameters.
        // /foo/bar?foo=bar&q=blah -> /foo/bar?q=blah
        state.path = extract_nav_url(state.path);

        // Truncate any closed navigational loops.
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].path === state.path ||
                (state.type === 'search' && stack[i].type === state.type)) {
                logger.log('Navigation loop truncated:', stack.slice(0, i));
                stack = stack.slice(i + 1);
                break;
            }
        }

        if (!stack.length) {
            // Band-aid patch for truncating issues.
            stack = [
                {path: '/', type: 'root'}
            ];
        }

        // Are we home? clear any history.
        if (state.type === 'root') {
            stack = [state];
            $('#search-q').val(''); // Bug 790009
        } else {
            // Handle the back and forward buttons.
            if (isPopping && stack[0].path === state.path) {
                logger.log('Shifting stack (used → or ← button)');
                stack.shift();
            } else {
                logger.log('Pushed state onto stack: ', state.path);
                stack.unshift(state);
            }

            // Does the page have a parent? If so, handle the parent logic.
            if (z.context.parent) {
                var parent = _.indexOf(_.pluck(stack, 'path'), z.context.parent);

                if (parent > 1) {
                    // The parent is in the stack and it's not immediately
                    // behind the current page in the stack.
                    stack.splice(1, parent - 1);
                    logger.log('Closing navigation loop to parent (1 to ' + (parent - 1) + ')');
                } else if (parent === -1) {
                    // The parent isn't in the stack. Splice it in just below
                    // where the value we just pushed in is.
                    stack.splice(1, 0, {path: z.context.parent});
                    logger.log('Injecting parent into nav stack at 1');
                }
                logger.log('New stack size: ' + stack.length);
            }
        }
    }


    function back() {
        if (stack.length > 1) {
            stack.shift();
            history.replaceState(stack[0], false, stack[0].path);
            navigate(stack[0].path, true, stack[0]);
        } else {
            logger.warn('Attempted to go back from root!');
        }
    }

    z.page.on('navigate divert', function(e, url, params) {
        logger.log('Received ' + e.type + ' event:', url);
        if (!url) {
            return;
        }
        if (!stack.length) {
            stack = [
                {path: '/', type: 'root'}
            ];
        }

        z.page.trigger('navigation--pre-navigate', [stack[0]]);

        var divert = e.type === 'divert';
        var newState = {
            params: params,
            path: url
        };
        var state_method = history.pushState;

        if (!initialized || divert) {
            // If redirect/haven't loaded page yet, replaceState > pushState.
            logger.log('Using replaceState due to ' +
                        (initialized ? 'diversion' : 'fresh load'));
            state_method = history.replaceState;
        }
        if (divert) {
            stack.shift();
        }
        state_method.apply(history, [newState, false, url]);
        navigate(url, false, newState);
    });


    z.body.on('click', 'a', function(e) {
        var href = this.getAttribute('href');
        var $elm = $(this);
        if (e.metaKey || e.ctrlKey || e.button !== 0) {
            return;
        }
        if (navigationFilter(this)) {
            return;
        }
        // Don't use utils._pd. Check for above situations first.
        e.preventDefault();
        e.stopPropagation();
        z.page.trigger('navigate', [href, $elm.data('params') || {path: href}]);
    });


    function extract_nav_url(url) {
        // Returns URL for nav, filtering/ordering params to pass equal. tests.
        if (url.indexOf('?') < 0) {
            // If no URL params, return original URL.
            return url;
        }

        // Can't use urlparams() because that extends not replaces.
        var used_params = _.pick(utils.querystring(url), settings.param_whitelist);
        var queryParams = utils.urlencode(used_params);
        return utils.baseurl(url) + (queryParams.length ? '?' + queryParams : '');
    }


    function navigationFilter(el) {
        var href = el.getAttribute('href') || el.getAttribute('action');
        return !href || href.substr(0, 4) === 'http' ||
                href.substr(0, 7) === 'mailto:' ||
                href.substr(0, 11) === 'javascript:' ||  // jshint ignore:line
                href[0] === '#' ||
                href.indexOf('?modified=') !== -1 ||
                el.getAttribute('target') ||
                el.getAttribute('rel') === 'external';
    }


    z.win.on('popstate', function(e) {
        if (!initialized) {
            // Sometimes Chrome can get weird.
            return;
        }
        var state = e.originalEvent.state;
        if (state) {
            if (state.closeModalName) {
                logger.log('popstate closing modal');
                cleanupModal(state.closeModalName);
            } else {
                logger.log('popstate navigate');
                navigate(state.path, true, state);
            }
        }
    })

    .on('submit', 'form', function() {
        console.error("Form submissions are not allowed.");
        return false;
    });


    function modal(name) {
        logger.log('Opening modal', name);
        stack[0].closeModalName = name;
        history.replaceState(stack[0], false, stack[0].path);
        history.pushState(null, name, '#' + name);
        var path = window.location.href + '#' + name;
        stack.unshift({path: path, type: 'modal', name: name});
    }

    function cleanupModal(name) {
        stack.shift();
        delete stack[0].closeModalName;
        z.win.trigger('closeModal', name);
    }

    function closeModal(name) {
        if (stack[0].type === 'modal' && stack[0].name === name) {
            logger.log('Closing modal', name);
            history.back();
        } else {
            logger.log('Attempted to close modal', name, 'that was not open');
        }
    }

    return {
        'back': back,
        'modal': modal,
        'closeModal': closeModal,
        'stack': function() {
            return stack;
        },
        'navigationFilter': navigationFilter,
        'extract_nav_url': extract_nav_url
    };
});
