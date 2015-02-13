/*
    Handles scroll state alongside navigation.
    Scroll state has a long history which can be seen at bug 986625.
*/
define('core/scroll_state',
    ['core/log', 'core/z'],
    function(log, z) {
    var logger = log('scroll_state');

    z.page.on('navigation--pre-navigate', function(e, state) {
        // state -- current state before we shift to a new one onto stack.
        logger.log('Navigating to new page, setting scroll to 0');

        // Preserve scroll of current state before we reset the scroll to 0.
        var scrollTop = window.pageYOffset;
        if (scrollTop !== state.scrollTop) {
            logger.log('Preserving scroll state', scrollTop);
            state.scrollTop = scrollTop;
            state.docHeight = z.doc.height();
            history.replaceState(state, false, state.path);
        }

        // Now that scroll state is saved, set to 0.
        // Setting scroll without waiting on an event or setTimeout can
        // sometimes cause some race condition where the scroll is never set.
        z.page.one('builder--post-render', function() {
            setTimeout(function() {
                window.scrollTo(0, 0);
            });
        });
    });

    z.page.on('navigation--pop-state', function(e, state) {
        // If popping history state, check if we have a scrollTop saved.
        // If so, then reset the scroll to the saved scrollTop.
        if (!state.scrollTop) {
            return;
        }

        logger.log('Popping and resetting scroll to', state.scrollTop);
        z.page.one('loaded', function() {
            if (state.docHeight) {
                z.body.css('min-height', state.docHeight);
                z.page.one('loaded', function() {
                    z.body.css('min-height', '');
                });
            }
            setTimeout(function() {
                window.scrollTo(0, state.scrollTop);
            });
        });
    });
});
