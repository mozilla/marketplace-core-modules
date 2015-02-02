define('tests/models', ['assert', 'underscore', 'Squire'], function(a, _, Squire) {
    var assert = a.assert;
    var eq_ = a.eq_;
    var eeq_ = a.eeq_;
    var mock = a.mock;

    function injector() {
        return new Squire();
    }

    describe.only('models', function() {
        it('errors on invalid type', function(done, fail) {
            injector().require(['models'], function(models) {
                try {
                    var d1 = models('does not exist trololo');
                    fail();
                } catch(e) {
                    done();
                }
            });
        });

        it('can cast/lookup/purge', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id', 'dummy2': 'id'}
            })
            .run(['models'], function(models) {
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

                eq_(d1.lookup(1).val, 'foo');
                eq_(d2.lookup(1).val, 'bar');
                eq_(d2.lookup(2).val, 'abc');

                d1.purge();
                d2.purge();

                eeq_(d1.lookup(1), undefined);
                eeq_(d2.lookup(1), undefined);
                eeq_(d2.lookup(2), undefined);
            }));

        it('can cast/lookup/delete', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
                var d1 = models('dummy');
                d1.cast({
                    id: 1,
                    val: 'foo'
                });

                eq_(d1.lookup(1).val, 'foo');
                d1.del(2);
                eq_(d1.lookup(1).val, 'foo');
                d1.del(1);
                eeq_(d1.lookup(1), undefined);
            }));

        it('can cast/lookup/delete val', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
                var d1 = models('dummy');
                d1.cast({
                    id: 1,
                    val: 'foo'
                });

                eq_(d1.lookup(1).val, 'foo');
                d1.del('bar', 'val');
                eq_(d1.lookup(1).val, 'foo');
                d1.del('foo', 'val');
                eeq_(d1.lookup(1), undefined);
            }));

        it('can cast/uncast', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
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
                eq_(d1.uncast(obj2).val, 'foo');
            }));

        it('model cast/uncast lists', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
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
                eq_(output[0].val, 'foo');
                eq_(output[1].val, 'bar');
            }));

        it('model get hit', function(done) {
            injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            }).mock('requests', {
                get: function(x) {
                    return 'surprise! ' + x;
                },
            }).require(['models'], function(models) {
                var d1 = models('dummy');

                d1.cast({
                    id: 1,
                    val: 'foo'
                });

                var promise = d1.get('zip', 1);
                promise.done(function(data) {
                    eq_(data.val, 'foo');
                    eeq_(promise.__cached, true);
                    done();
                });
            });
        });

        it('model get miss', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .mock('requests', {
                get: function(x) {
                    return 'surprise! ' + x;
                },
            })
            .run(['models'], function(models) {
                var d1 = models('dummy');

                var obj = d1.get('zip', 1);
                console.log(JSON.stringify(obj));

                eq_(obj, 'surprise! zip');
            }));

        it('model get getter', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .mock('requests', {
                get: function(x) {
                    return "not the droids you're looking for";
                },
            })
            .run(['models'], function(models) {
                var d1 = models('dummy');

                eq_(d1.get('zip', 1, function(x) {
                    return 'hooray! ' + x;
                }), 'hooray! zip');
            }));

        it('model lookup by', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
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
                eq_(value.id, 'foo');
                eq_(value.val, 'bar');
            }));

        it('model lookup miss', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
                var d1 = models('dummy');

                // Just a decoy
                d1.cast({
                    id: 'zip',
                    val: 'foo'
                });

                eeq_(d1.lookup('not an id'), undefined);
            }));

        it('model cast list', injector().mock('settings', {
                offline_cache_enabled: function () { return false; },
                model_prototypes: {'dummy': 'id'}
            })
            .run(['models'], function(models) {
                var d1 = models('dummy');

                // Just a decoy
                d1.cast([
                    {id: 'zip', val: 1},
                    {id: 'abc', val: 2},
                    {id: 'def', val: 3}
                ]);

                eq_(d1.lookup('abc').val, 2);
            }));
    });
});
