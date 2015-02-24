define('core/views/my_view', [], function() {
    return {itsMe: 'Sure Is!'};
});
define('tests/router',
    ['core/router', 'core/views/my_view'],
    function(router) {

    function clearRoutes() {
        router.clearRoutes();
        router.api.clearProcessors();
        router.api.clearRoutes();
    }

    describe('routing views', function() {
        this.beforeEach(clearRoutes);
        this.afterEach(clearRoutes);

        it('handles core view names', function(done) {
            router.addRoute({pattern: '^/my-view$', view_name: 'core/my_view'});
            router.routes[0].view().done(function(view) {
                assert.deepEqual(view, require('core/views/my_view'));
                done();
            });
        });
    });

    describe('router.api.args', function() {
        this.beforeEach(clearRoutes);
        this.afterEach(clearRoutes);

        it('can have multiple processors', function() {
            router.api.addProcessor(function() {
                return {foo: 'foo'};
            });
            router.api.addProcessor(function() {
                return {bar: 'bar'};
            });
            assert.deepEqual(router.api.args('user'),
                             {foo: 'foo', bar: 'bar'});
        });

        it('can have a processor return undefined', function() {
            router.api.addProcessor(function() {
                return {foo: 'foo'};
            });
            router.api.addProcessor(function() {});
            router.api.addProcessor(function() {
                return {bar: 'bar'};
            });
            assert.deepEqual(router.api.args('user'),
                             {foo: 'foo', bar: 'bar'});
        });

        it('maintains the order of processors', function() {
            router.api.addProcessor(function() {
                return {foo: 'foo'};
            });
            router.api.addProcessor(function() {
                return {foo: 'bar'};
            });
            assert.deepEqual(router.api.args('user'), {foo: 'bar'});
        });

        it('works without processors', function() {
            assert.deepEqual(router.api.args('user'), {});
        });
    });
});
