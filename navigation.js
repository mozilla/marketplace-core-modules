define('navigation',
    ['capabilities', 'l10n', 'log', 'notification', 'settings', 'underscore', 'utils', 'views', 'z'],
    function(capabilities, l10n, log, notification, settings, _, utils, views, z) {
    'use strict';

    var console = log('nav');

    var gettext = l10n.gettext;
    var stack = [
        {path: '/', type: 'root'}
    ];
    var initialized = false;
    var scrollTimer;

    function extract_nav_url(url) {
        // This function returns the URL that we should use for navigation.
        // It filters and orders the parameters to make sure that they pass
        // equality tests down the road.

        // If there's no URL params, return the original URL.
        if (url.indexOf('?') < 0) {
            return url;
        }

        // We can't use urlparams() because that only extends, not replaces.
        var used_params = _.pick(utils.querystring(url), settings.param_whitelist);
        var queryParams = utils.urlencode(used_params);
        return utils.baseurl(url) + (queryParams.length ? '?' + queryParams : '');
    }

    function canNavigate() {
        if (!navigator.onLine && !capabilities.phantom) {
            notification.notification({message: gettext('No internet connection')});
            return !!settings.offline_capable;
        }
        return true;
    }

    function navigate(href, popped, state) {
        if (!state) {return;}

        console.log('Navigation started: ', href);
        var view = views.match(href);
        if (view === null) {
            return;
        }

        if (!view[1] && initialized) {
            window.location.href = href;
            return;
        }

        if (initialized) {
            // Call navigating before the view build function so that modules
            // the view depend on can react in time.
            z.win.trigger('navigating', [popped]);
        }
        views.build(view[0], view[1], state.params);
        initialized = true;
        state.type = z.context.type;
        state.title = z.context.title;

        var top = 0;
        if ((state.preserveScroll || popped) && state.scrollTop) {
            if (state.docHeight) {
                // Preserve document min-height for scroll restoration.
                z.body.css('min-height', state.docHeight);
                z.page.one('loaded', function() {
                    // Remove specified min-height.
                    z.body.css('min-height', '');
                });
            }
            top = state.scrollTop;
        }

        if (capabilities.firefoxAndroid) {
            // Introduce small delay for Firefox for Android to ensure
            // content is ready to scroll (bug 976466).
            if (scrollTimer) {
                window.clearTimeout(scrollTimer);
            }
            scrollTimer = window.setTimeout(function() {
                console.log('Setting scroll to', top);
                window.scrollTo(0, top);
            }, 250);
        } else {
            // Otherwise, scroll to the top immediately.
            window.scrollTo(0, top);
        }

        // Clean the path's parameters.
        // /foo/bar?foo=bar&q=blah -> /foo/bar?q=blah
        state.path = extract_nav_url(state.path);

        // Truncate any closed navigational loops.
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].path === state.path ||
                (state.type === 'search' && stack[i].type === state.type)) {
                console.log('Navigation loop truncated:', stack.slice(0, i));
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
            // handle the back and forward buttons.
            if (popped && stack[0].path === state.path) {
                console.log('Shifting stack (used → or ← button)');
                stack.shift();
            } else {
                console.log('Pushed state onto stack: ', state.path);
                stack.unshift(state);
            }

            // Does the page have a parent? If so, handle the parent logic.
            if (z.context.parent) {
                var parent = _.indexOf(_.pluck(stack, 'path'), z.context.parent);

                if (parent > 1) {
                    // The parent is in the stack and it's not immediately
                    // behind the current page in the stack.
                    stack.splice(1, parent - 1);
                    console.log('Closing navigation loop to parent (1 to ' + (parent - 1) + ')');
                } else if (parent === -1) {
                    // The parent isn't in the stack. Splice it in just below
                    // where the value we just pushed in is.
                    stack.splice(1, 0, {path: z.context.parent});
                    console.log('Injecting parent into nav stack at 1');
                }
                console.log('New stack size: ' + stack.length);
            }
        }

    }

    function back() {
        if (!canNavigate()) {
            console.log('← aborted; canNavigate is falsey.');
            return;
        }

        if (stack.length > 1) {
            stack.shift();
            history.replaceState(stack[0], false, stack[0].path);
            navigate(stack[0].path, true, stack[0]);
        } else {
            console.warn('attempted to go ← at root!');
        }
    }

    z.page.on('navigate divert', function(e, url, params, preserveScroll) {
        console.log('Received ' + e.type + ' event:', url);
        if (!url) {return;}

        var divert = e.type === 'divert';
        var newState = {
            params: params,
            path: url
        };
        var scrollTop = window.pageYOffset;
        var state_method = history.pushState;

        if (preserveScroll) {
            newState.preserveScroll = preserveScroll;
            newState.scrollTop = scrollTop;
            newState.docHeight = z.doc.height();
        }

        if (!canNavigate()) {
            console.log('Navigation aborted; canNavigate is falsey.');
            return;
        }

        // Update scrollTop for current history state.
        if (stack.length && scrollTop !== stack[0].scrollTop) {
            stack[0].scrollTop = scrollTop;
            console.log('Updating scrollTop with replaceState');
            history.replaceState(stack[0], false, stack[0].path);
        }

        if (!initialized || divert) {
            // If we're redirecting or we've never loaded a page before,
            // use replaceState instead of pushState.
            console.log('Using replaceState due to ' +
                        (initialized ? 'diversion' : 'fresh load'));
            state_method = history.replaceState;
        }
        if (divert) {
            stack.shift();
        }
        state_method.apply(history, [newState, false, url]);
        navigate(url, false, newState);
    });

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

    z.body.on('click', 'a', function(e) {
        var href = this.getAttribute('href');
        var $elm = $(this);
        var preserveScrollData = $elm.data('preserveScroll');
        // Handle both data-preserve-scroll and data-preserve-scroll="true"
        var preserveScroll = typeof preserveScrollData !== 'undefined' && preserveScrollData !== false;
        if (e.metaKey || e.ctrlKey || e.button !== 0) {return;}
        if (navigationFilter(this)) {return;}

        // We don't use _pd because we don't want to prevent default for the
        // above situations.
        e.preventDefault();
        e.stopPropagation();
        z.page.trigger('navigate', [href, $elm.data('params') || {path: href}, preserveScroll]);

    });

    z.win.on('popstate', function(e) {
        if (!initialized) {
            // Sometimes Chrome can get weird.
            return;
        }
        var state = e.originalEvent.state;
        if (state) {
            if (state.closeModalName) {
                console.log('popstate closing modal');
                cleanupModal(state.closeModalName);
            } else {
                console.log('popstate navigate');
                navigate(state.path, true, state);
            }
        }
    }).on('submit', 'form', function() {
        console.error("Form submissions are not allowed.");
        return false;
    });

    function modal(name) {
        console.log('Opening modal', name);
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
            console.log('Closing modal', name);
            history.back();
        } else {
            console.log('Attempted to close modal', name, 'that was not open');
        }
    }

    return {
        'back': back,
        'modal': modal,
        'closeModal': closeModal,
        'stack': function() {return stack;},
        'navigationFilter': navigationFilter,
        'extract_nav_url': extract_nav_url
    };

});
