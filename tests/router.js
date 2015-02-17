define('core/views/my_view', [], function() {
    return {itsMe: 'Sure Is!'};
});
define('tests/router',
    ['core/router', 'core/views/my_view'],
    function(router) {

    describe('routing views', function() {
        this.beforeEach(function() {
            router.clearRoutes();
        });

        this.afterEach(function() {
            router.clearRoutes();
        });

        it('handles core view names', function() {
            router.addRoute({pattern: '^/my-view$', view_name: 'core/my_view'});
            assert.deepEqual(router.routes[0].view, require('core/views/my_view'));
        });
    });
});
