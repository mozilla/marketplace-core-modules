define('tests/models',
    ['core/cache', 'core/models', 'core/requests', 'underscore'],
    function(cache, models, requests, _) {

    describe('models', function() {
        this.afterEach(function() {
            withSettings({model_prototypes: {foo: 'id'}}, function() {
                cache.flush();
                models('foo').flush();
            });
        });

        it('errors on invalid type', function(done, fail) {
            try {
                var d1 = models('does not exist trololo');
                fail();
            } catch(e) {
                done();
            }
        });

        it('can cast/lookup/purge', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id', 'dummy2': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');
                var d2 = models('dummy2');

                d1.cast({
                    id: 1,
                    val: 'foo'
                });
                d2.cast({
                    id: 1,
                    val: 'bar'
                });
                d2.cast({
                    id: 2,
                    val: 'abc'
                });

                assert.equal(d1.lookup(1).val, 'foo');
                assert.equal(d2.lookup(1).val, 'bar');
                assert.equal(d2.lookup(2).val, 'abc');

                d1.purge();
                d2.purge();

                assert.strictEqual(d1.lookup(1), undefined);
                assert.strictEqual(d2.lookup(1), undefined);
                assert.strictEqual(d2.lookup(2), undefined);
            });
        });

        it('can cast/lookup/delete', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');
                d1.cast({
                    id: 1,
                    val: 'foo'
                });

                assert.equal(d1.lookup(1).val, 'foo');
                d1.del(2);
                assert.equal(d1.lookup(1).val, 'foo');
                d1.del(1);
                assert.strictEqual(d1.lookup(1), undefined);
            });
        });

        it('can cast/lookup/delete val', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');
                d1.cast({
                    id: 1,
                    val: 'foo'
                });

                assert.equal(d1.lookup(1).val, 'foo');
                d1.del('bar', 'val');
                assert.equal(d1.lookup(1).val, 'foo');
                d1.del('foo', 'val');
                assert.strictEqual(d1.lookup(1), undefined);
            });
        });

        it('can cast/uncast', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                var obj1 = {
                    id: 1,
                    val: 'foo'
                };
                var obj2 = {
                    id: 1,
                    val: 'bar'
                };

                d1.cast(obj1);
                assert.equal(d1.uncast(obj2).val, 'foo');
            });
        });

        it('model cast/uncast lists', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                var obj1 = {
                    id: 1,
                    val: 'foo'
                };
                var obj2 = {
                    id: 2,
                    val: 'bar'
                };
                var obj3 = {
                    id: 1,
                    val: 'zip'
                };
                var obj4 = {
                    id: 2,
                    val: 'zap'
                };

                d1.cast([obj1, obj2]);

                var output = d1.uncast([
                    obj3,
                    obj4
                ]);
                assert.equal(output[0].val, 'foo');
                assert.equal(output[1].val, 'bar');
            });
        });

        it('model get hit', function(done) {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };

            sinon.stub(requests, 'get', function(x) {
                return 'surprise! ' + x;
            });

            withSettings(newSettings, function() {
                var d1 = models('dummy');

                d1.cast({
                    id: 1,
                    val: 'foo'
                });

                var promise = d1.get('zip', 1);
                promise.done(function(data) {
                    assert.equal(data.val, 'foo');
                    assert.strictEqual(promise.__cached, true);
                    done();
                });
            });
        });

        it('model get miss', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            sinon.stub(requests, 'get', function(x) {
                return 'surprise! ' + x;
            });
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                var obj = d1.get('zip', 1);
                console.log(JSON.stringify(obj));

                assert.equal(obj, 'surprise! zip');
            });
        });

        it('model get getter', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            sinon.stub(requests, 'get', function(x) {
                return "not the droids you're looking for";
            });
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                assert.equal(d1.get('zip', 1, function(x) {
                    return 'hooray! ' + x;
                }), 'hooray! zip');
            });
        });

        it('model lookup by', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                d1.cast({
                    id: 'zip',
                    val: 'foo'
                });

                d1.cast({
                    id: 'foo',
                    val: 'bar'
                });

                var value = d1.lookup('bar', 'val');
                assert.equal(value.id, 'foo');
                assert.equal(value.val, 'bar');
            });
        });

        it('model lookup miss', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                // Just a decoy
                d1.cast({
                    id: 'zip',
                    val: 'foo'
                });

                assert.strictEqual(d1.lookup('not an id'), undefined);
            });
        });

        it('model cast list', function() {
            var newSettings = {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            };
            withSettings(newSettings, function() {
                var d1 = models('dummy');

                // Just a decoy
                d1.cast([
                    {id: 'zip', val: 1},
                    {id: 'abc', val: 2},
                    {id: 'def', val: 3}
                ]);

                assert.equal(d1.lookup('abc').val, 2);
            });
        });
    });
});
