define('tests/cache',
    ['core/cache', 'core/settings', 'core/user', 'underscore'],
    function(cache, settings, user, _) {

    describe('cache', function() {
        this.afterEach(function() {
            cache.purge();
        });

        it('has set/has/get/bust', function() {
            var key = 'test:thisisatest';
            var str = 'foobartest';
            assert(!cache.has(key));
            cache.set(key, str);
            assert(cache.has(key));
            assert.equal(cache.get(key), str);
            assert(cache.has(key));
            cache.bust(key);
            assert(!cache.has(key));
        });

        it('has raw access', function() {
            var key = 'test:thisisanothertest';
            var str = 'foobartest';
            cache.set(key, str);
            assert(cache.has(key));
            assert.equal(cache.raw[key], str);
            cache.bust(key);
            assert(!cache.has(key));
            assert.strictEqual(cache.raw[key], undefined);
        });

        it('caches non-strings', function() {
            var key = 'test:thisisyetanothertest';
            var str = 1234;
            cache.set(key, str);
            assert(cache.has(key));
            assert.strictEqual(cache.get(key), str);
            cache.bust(key);
            assert(!cache.has(key));
        });

        it('has purge', function() {
            var key = 'test1:';
            var str = 'poop';
            cache.set(key + 'foo', str);
            cache.set(key + 'abc', str);
            cache.set(key + 'bar', str);
            cache.purge();
            assert.equal(_.size(cache.raw), 0);
            assert(!cache.has(key + 'foo'));
            assert(!cache.has(key + 'abc'));
            assert(!cache.has(key + 'bar'));
        });

        it('has purge filter', function() {
            var key = 'test2:';
            var str = 'poop';
            cache.set(key + 'foo', str);
            cache.set(key + 'abc', str);
            cache.set(key + 'bar', str);
            cache.purge(function(k) {return k == key + 'abc';});
            assert.equal(_.size(cache.raw), 2);
            assert(cache.has(key + 'foo'));
            assert(!cache.has(key + 'abc'));
            assert(cache.has(key + 'bar'));
        });
    });

    describe('cache rewriters', function() {
        this.afterEach(function() {
            cache.purge();
            cache.clearRewriters();
        });

        it('rewrites keys with attemptRewrite', function() {
            var key = 'test3:';
            var str = 'poop';
            cache.set(key + 'foo', str);
            cache.set(key + 'rewrite', str);
            cache.set(key + 'bar', str);
            assert(cache.has(key + 'foo'));
            assert(cache.has(key + 'rewrite'));
            assert(cache.has(key + 'bar'));

            cache.attemptRewrite(
                function(key) {return key.match(/rewrite/);},
                function(value, cache_key) {
                    assert.equal(cache_key, key + 'rewrite');
                    return 'not poop';
                }
            );
            assert(cache.has(key + 'foo'));
            assert(cache.has(key + 'rewrite'));
            assert(cache.has(key + 'bar'));

            assert.equal(cache.get(key + 'foo'), 'poop');
            assert.equal(cache.get(key + 'bar'), 'poop');
            assert.equal(cache.get(key + 'rewrite'), 'not poop');

            cache.bust(key + 'foo');
            cache.bust(key + 'bar');
            cache.bust(key + 'rewrite');
            assert(!cache.has(key + 'foo'));
            assert(!cache.has(key + 'rewrite'));
            assert(!cache.has(key + 'bar'));
        });

        it('can limit attemptRewrite rewrites', function() {
            var key = 'test4:';
            var str = 'poop';

            cache.purge();

            cache.set(key + 'foo', str);
            cache.set(key + 'abc', str);
            cache.set(key + 'bar', str);
            assert(cache.has(key + 'foo'));
            assert(cache.has(key + 'abc'));
            assert(cache.has(key + 'bar'));

            var arbitrary_limit = 2;

            cache.attemptRewrite(
                function(key) {return true;},
                function(value, cache_key) {
                    return 'rewritten';
                }, arbitrary_limit
            );
            assert(cache.has(key + 'foo'));
            assert(cache.has(key + 'abc'));
            assert(cache.has(key + 'bar'));

            var count = 0;
            if (cache.get(key + 'foo') === 'rewritten') count++;
            if (cache.get(key + 'abc') === 'rewritten') count++;
            if (cache.get(key + 'bar') === 'rewritten') count++;

            assert.equal(count, arbitrary_limit);

            cache.bust(key + 'foo');
            cache.bust(key + 'bar');
            cache.bust(key + 'abc');
            assert(!cache.has(key + 'foo'));
            assert(!cache.has(key + 'abc'));
            assert(!cache.has(key + 'bar'));
        });

        it('rewrites on set with a rewriter', function() {
            cache.addRewriter(function(new_key, new_value, c) {
                if (new_key !== 'foo') {
                    return;
                }
                return new_value.toUpperCase();
            });

            cache.set('foo', 'bar');
            cache.set('zip', 'zap');
            assert.equal(cache.get('foo'), 'BAR');
            assert.equal(cache.get('zip'), 'zap');
        });

        it('cache chained rewrite on set', function() {
            cache.addRewriter(function(new_key, new_value, c) {
                if (new_key !== 'foo') {
                    return;
                }
                return new_value.toUpperCase();
            });
            cache.addRewriter(function(new_key, new_value, c) {
                if (new_key[0] !== 'f') {
                    return;
                }
                return new_value + ' test';
            });

            cache.set('foo', 'bar');
            cache.set('fart', 'zap');
            cache.set('abc', 'def');
            assert.equal(cache.get('foo'), 'BAR test');
            assert.equal(cache.get('fart'), 'zap test');
            assert.equal(cache.get('abc'), 'def');
        });

        it('cache deep rewrite on set', function() {
            cache.addRewriter(function(new_key, new_value, c) {
                if (new_key[0] !== 'f') {
                    return;
                }
                c[new_key + ':deep'] += new_value;
                return null;  // Triggers an ignore.
            });

            cache.raw['foo:deep'] = 'asdf';
            cache.raw['fart:deep'] = 'asdf';

            cache.set('foo', 'bar');
            cache.set('fart', 'zap');
            cache.set('abc', 'def');

            assert(!cache.has('foo'));
            assert(!cache.has('fart'));
            assert.equal(cache.get('abc'), 'def');

            assert.equal(cache.get('foo:deep'), 'asdfbar');
            assert.equal(cache.get('fart:deep'), 'asdfzap');
        });

        it('get_ttl uses offline_cache_{enabled,whitelist}', function() {
            var newSettings = {
                offline_cache_enabled: function () { return true; },
                offline_cache_whitelist: {
                    '/api/v1/fireplace/consumer-info/': 60 * 60,  // 1 hour in seconds
                    '/api/v1/fireplace/search/featured/': 60 * 60 * 6,  // 6 hours
                    '/api/v1/apps/category/': 60 * 60 * 24  // 1 day
                },
            };
            withSettings(newSettings, function() {
                assert.equal(cache.get_ttl('https://omg.org/api/v1/fireplace/consumer-info/'),
                    60 * 60 * 1000);  // 1 hour in microseconds
                assert.equal(cache.get_ttl('https://omg.org/api/v1/apps/category/'),
                    60 * 60 * 24 * 1000);  // 1 hour in microseconds
                assert.equal(cache.get_ttl('https://omg.org/api/v1/swag/yolo/foreva/'), null);
            });
        });

        it('flush_signed removes user data', function() {
            var newSettings = {
                offline_cache_enabled: function() { return false; },
            };
            withSettings(newSettings, function() {
                var data = 'ratchet data';
                sinon.stub(user, 'logged_in').returns(true);
                sinon.stub(user, 'get_setting').returns(null);
                sinon.stub(user, 'get_token').returns('SwaggasaurusRex');

                var signed_url = 'https://omg.org/api/v1/app/yolo/?_user=SwaggasaurusRex';
                cache.set(signed_url, data);
                assert.equal(cache.get(signed_url), data);

                var unsigned_url = 'https://omg.org/api/v1/app/swag/';
                cache.set(unsigned_url, data);
                assert.equal(cache.get(unsigned_url), data);

                assert.deepEqual(Object.keys(cache.cache).sort(), [unsigned_url, signed_url]);

                // Calling this should clear all cache keys whose URLs contain
                // `_user=<token>`.
                cache.flush_signed();

                assert.deepEqual(Object.keys(cache.cache), [unsigned_url]);
            });
        });

        it('cache flush_expired', function() {
            var newSettings = {
                offline_cache_enabled: function () { return true; },
                offline_cache_whitelist: {
                    '/api/v1/fireplace/consumer-info/': 60 * 60,  // 1 hour in seconds
                    '/api/v1/fireplace/search/featured/': 60 * 60 * 6,  // 6 hours
                    '/api/v1/apps/category/': 60 * 60 * 24  // 1 day
                },
            };
            withSettings(newSettings, function() {
                // Both were just added and unexpired ...
                cache.set('https://omg.org/api/v1/fireplace/consumer-info/', {
                    '__time': +new Date()
                });
                cache.set('https://omg.org/api/v1/fireplace/search/featured/', {
                    '__time': +new Date()
                });
                cache.flush_expired();
                assert(cache.has('https://omg.org/api/v1/fireplace/consumer-info/'));
                assert(cache.has('https://omg.org/api/v1/fireplace/search/featured/'));

                // Neither has expired ...
                cache.set('https://omg.org/api/v1/fireplace/consumer-info/', {
                    '__time': +new Date() - (60 * 59 * 1000)  // 59 min ago in microseconds
                });
                cache.flush_expired();
                assert(cache.has('https://omg.org/api/v1/fireplace/consumer-info/'));
                assert(cache.has('https://omg.org/api/v1/fireplace/search/featured/'));

                // One has expired!
                cache.set('https://omg.org/api/v1/fireplace/consumer-info/', {
                    '__time': +new Date() - (60 * 65 * 1000)  // 1 hr 5 min ago in microseconds
                });
                cache.flush_expired();
                assert(!cache.has('https://omg.org/api/v1/fireplace/consumer-info/'));
                assert(cache.has('https://omg.org/api/v1/fireplace/search/featured/'));
            console.log(Object.keys(settings));
            });
            console.log(Object.keys(settings));
        });
    });
});
