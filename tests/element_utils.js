define('tests/element_utils',
    ['core/element_utils'],
    function(eUtils) {

    describe('each', function() {
        it('iterates over NodeList', function() {
            var e1 = document.createElement('a');
            var e2 = document.createElement('a');
            var div = document.createElement('div');
            div.appendChild(e1);
            div.appendChild(e2);

            eUtils.each(div.querySelectorAll('a'), function(a) {
                assert.equal(a.tagName, 'A');
                assert.equal(a.parentNode, div);
            });
        });
    });


    describe('toggleClass', function() {
        it('toggles', function() {
            var e = document.createElement('a');
            eUtils.toggleClass(e, 'foo');
            assert.ok(e.classList.contains('foo'),
                      'Check foo on after toggle');
            eUtils.toggleClass(e, 'foo');
            assert.notOk(e.classList.contains('foo'),
                         'Check foo off after 2nd toggle');
            eUtils.toggleClass(e, 'foo');
            assert.ok(e.classList.contains('foo'),
                      'Check foo on after 3rd toggle');
        });

        it('toggles true', function() {
            var e = document.createElement('a');
            eUtils.toggleClass(e, 'foo', true);
            assert.ok(e.classList.contains('foo'),
                      'Check foo on after toggle true');
            eUtils.toggleClass(e, 'foo', true);
            assert.ok(e.classList.contains('foo'),
                      'Check foo on after 2nd toggle true');
        });

        it('toggles false', function() {
            var e = document.createElement('a');
            eUtils.toggleClass(e, 'foo', true);
            assert.ok(e.classList.contains('foo'));
            eUtils.toggleClass(e, 'foo', false);
            assert.notOk(e.classList.contains('foo'),
                      'Check foo off after toggle false');
            eUtils.toggleClass(e, 'foo', false);
            assert.notOk(e.classList.contains('foo'),
                         'Check foo off after 2nd toggle false');
        });
    });


    describe('MktEvent', function() {
        it('is valid', function(done) {
            var e = document.createElement('a');
            var mktEvent = eUtils.MktEvent('my-event', {});
            e.addEventListener('my-event', function() {
                e.setAttribute('data-we-did-it', true);
                assert.ok(e.hasAttribute('data-we-did-it'));
                done();
            });

            e.dispatchEvent(mktEvent);
        });
    });


    describe('updateActiveNode', function() {
        it('updates active node', function() {
            var div = document.createElement('div');
            var e1 = document.createElement('a');
            e1.setAttribute('href', 'foo');
            var e2 = document.createElement('a');
            e2.setAttribute('href', 'bar');
            div.appendChild(e1);
            div.appendChild(e2);

            eUtils.updateActiveNode(div, 'active', 'foo');
            assert.ok(e1.classList.contains('active'),
                      'Check e1 active after path==foo');
            assert.notOk(e2.classList.contains('active'),
                         'Check e2 not active after path==foo');

            eUtils.updateActiveNode(div, 'active', 'bar');
            assert.notOk(e1.classList.contains('active'));
            assert.ok(e2.classList.contains('active'));

            eUtils.updateActiveNode(div, 'active', 'bar');
            assert.notOk(e1.classList.contains('active'));
            assert.ok(e2.classList.contains('active'));
        });
    });


    describe('proxyInterface', function() {
        it('proxies properties', function() {
            var destObj = {
                innerObj: {
                    x: 5
                }
            };
            eUtils.proxyInterface(destObj, ['x'], [], 'innerObj');
            assert.equal(destObj.x, 5);
        });

        it('proxies methods', function() {
            var destObj = {
                innerObj: {
                    x: function() {
                        return 5;
                    }
                }
            };
            eUtils.proxyInterface(destObj, [], ['x'], 'innerObj');
            assert.equal(destObj.x(), 5);
        });
    });
});
