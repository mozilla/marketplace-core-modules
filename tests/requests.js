define('tests/requests',
    ['core/cache', 'core/defer', 'core/requests'],
    function(cache, defer, requests) {

    function mock_xhr(args) {
        var def = defer.Deferred();
        def.args = arguments;
        return def;
    }

    describe('requests', function() {
        this.beforeEach(function() {
            sinon.stub(requests.helpers, 'ajax', mock_xhr);
        });

        this.afterEach(function() {
            cache.flush();
            requests.clearHooks();
        });

        describe('.get', function() {
            it('gets data', function(done, fail) {
                var def = requests.get('foo/bar');
                // Test that the URL isn't mangled before being sent to jQuery.
                assert.equal(def.args[0], 'GET');
                assert.equal(def.args[1], 'foo/bar');
                assert.equal(def.args[2], null);
                def.done(function(data) {
                    assert.equal(data, 'sample data');
                    done();
                }).fail(fail);
                def.resolve('sample data');
            });

            it('has a cache cached', function(done, fail) {
                var uncached = requests.get('foo/bar');
                assert(!('__cached' in uncached));
                uncached.resolve('data to cache');

                var def = requests.get('foo/bar');
                assert('__cached' in def);
                def.done(function(data) {
                    assert.equal(data, 'data to cache');
                    done();
                }).fail(fail);
            });

            it('is different on different calls', function(done, fail) {
                var one = requests.get('foo/bar');
                assert(!('__cached' in one));
                one.resolve('data to cache');

                var two = requests.get('foo/bar');
                assert('__cached' in two);
                two.done(function(data) {
                    assert.equal(data, 'data to cache');
                    done();
                }).fail(fail);
            });

            it('supports nocache', function(done, fail) {
                var uncached = requests.get('foo/bar', true);
                assert(!('__cached' in uncached));
                uncached.resolve('data to cache');

                var def = requests.get('foo/bar', true);
                assert(!('__cached' in uncached));
                done();
            });

            it('has a success hook', function(done, fail) {
                requests.on('success', function(data) {
                    assert.equal(data, 'sample data');
                    done();
                }).on('failure', fail);

                var def = requests.get('foo/bar');
                def.resolve('sample data');
            });

            it('has a fail hook', function(done, fail) {
                requests.on('failure', function(data) {
                    assert.equal(data, 'bad data');
                    done();
                }).on('success', fail);

                var def = requests.get('foo/bar');
                def.reject('bad data');
            });
        });

        var data = {foo: 'bar'};
        var methods_to_test = ['post', 'del', 'put', 'patch'];
        var test_output = {
            post: ['POST', 'foo/bar', data],
            del: ['DELETE', 'foo/bar', data],
            put: ['PUT', 'foo/bar', data],
            patch: ['PATCH', 'foo/bar', data]
        };

        methods_to_test.forEach(function(v) {
            describe('.' + v, function() {
                it('makes requests', function(done, fail) {
                    var def = requests[v]('foo/bar', data);
                    assert.equal(def.args[0], test_output[v][0]);
                    assert.equal(def.args[1], test_output[v][1]);
                    assert.equal(def.args[2], test_output[v][2]);
                    def.done(function(data) {
                        assert.equal(data, 'sample data');
                        done();
                    }).fail(fail);
                    def.resolve('sample data');
                });

                it('is never cached', function(done, fail) {
                    var uncached = requests.get('foo/bar');
                    assert(!('__cached' in uncached));
                    uncached.resolve('data to cache');

                    requests[v]('foo/bar', {foo: 'bar'});
                    assert(!('__cached' in uncached));
                    uncached.resolve('data to cache');

                    var def = requests[v]('foo/bar', {foo: 'bar'});
                    assert(!('__cached' in def));

                    def.done(function(data) {
                        assert.equal(data, 'boop');
                        done();
                    }).fail(fail);
                    def.resolve('boop');
                });
            });
        });

        describe('.pool', function() {
            it('has HTTP methods', function(done, fail) {
                var pool = requests.pool();

                var orig_req = pool.get('test/foo');
                var second_req = pool.get('test/foo');
                assert.equal(orig_req, second_req);  // Pools should coalesce GET requests.

                var orig_post_req = pool.post('test/foo', {abc: 'def'});
                var second_post_req = pool.post('test/foo', {abc: 'def'});
                assert(orig_post_req != second_post_req);  // Pools should never coalesce POSTs.

                var orig_del_req = pool.del('test/foo');
                var second_del_req = pool.del('test/foo');
                assert(orig_del_req != second_del_req);  // Pools should never coalesce DELETEs.

                var orig_put_req = pool.put('test/foo');
                var second_put_req = pool.put('test/foo');
                assert(orig_put_req != second_put_req);  // Pools should never coalesce PUTs.

                var orig_patch_req = pool.patch('test/foo');
                var second_patch_req = pool.patch('test/foo');
                assert(orig_patch_req != second_patch_req);  // Pools should never coalesce PATCHs.

                // Test that it's actually the same request.
                second_req.done(function(data) {
                    assert.equal(data, 'sample data');
                    done();
                });
                orig_req.resolve('sample data');
            });

            it('can abort', function(done, fail) {
                var pool = requests.pool();

                var orig_req = pool.get('test/foo');
                orig_req.abort = done;
                orig_req.done(fail);
                orig_req.isSuccess = false;

                pool.abort();
            });

            it('abort resolution', function(done, fail) {
                var pool = requests.pool();
                pool.fail(done);
                pool.abort();
            });

            it('can finish', function(done, fail) {
                var timing = fail;
                var timing_closure = function() {
                    timing();
                };

                var pool = requests.pool();
                pool.done(timing_closure);

                // It shouldn't have resolved up until now. Now it should resolve.
                timing = done;
                pool.finish();
            });

            it('can finish resolution', function(done, fail) {
                var timing = fail;
                var timing_closure = function() {
                    timing();
                };

                var pool = requests.pool();
                pool.done(timing_closure);

                pool.get('foo/bar').resolve('it finished');
                pool.post('foo/bar', {some: 'data'}).resolve('it finished also');
                pool.del('foo/bar').resolve('it finished also');

                // It shouldn't have resolved up until now. Now it should resolve.
                timing = done;
                pool.finish();
            });
        });
    });
});
