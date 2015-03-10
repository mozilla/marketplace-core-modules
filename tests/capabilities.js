define('tests/capabilities',
    ['core/capabilities', 'Squire'],
    function(capabilities, Squire) {

    describe('capabilities.device_platform', function() {
        it('can be firefoxos', function() {
            var caps = {firefoxOS: true};
            assert.equal(capabilities.device_platform(caps), 'firefoxos');
        });

        it('can be android', function() {
            var caps = {firefoxOS: false, firefoxAndroid: true};
            assert.equal(capabilities.device_platform(caps), 'android');
        });

        it('can be desktop', function() {
            var caps = {firefoxAndroid: false};
            assert.equal(capabilities.device_platform(caps), 'desktop');
        });
    });

    describe('capabilities.device_formfactor', function() {
        it('is nothing for firefoxOS mobile', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            assert.equal(capabilities.device_formfactor(caps), '');
        });

        it('is nothing for firefoxOS tablet', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            assert.equal(capabilities.device_formfactor(caps), '');
        });

        it('is mobile for Android mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return false; },
            };
            assert.equal(capabilities.device_formfactor(caps), 'mobile');
        });

        it('is tablet for Android tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return true; },
            };
            assert.equal(capabilities.device_formfactor(caps), 'tablet');
        });

        it('is nothing for other mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            assert.equal(capabilities.device_formfactor(caps), '');
        });

        it('is nothing for other tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            assert.equal(capabilities.device_formfactor(caps), '');
        });
    });

    describe('capabilities.device_type', function() {
        it('is firefoxos on FirefoxOS mobile', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            assert.equal(capabilities.device_type(caps), 'firefoxos');
        });

        it('is firefoxOS on FirefoxOS tablet', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            assert.equal(capabilities.device_type(caps), 'firefoxos');
        });

        it('is android-mobile on Android mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return false; },
            };
            assert.equal(capabilities.device_type(caps), 'android-mobile');
        });

        it('is android-tablet on Android tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return true; },
            };
            assert.equal(capabilities.device_type(caps), 'android-tablet');
        });

        it('is desktop on other mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            assert.equal(capabilities.device_type(caps), 'desktop');
        });

        it('is desktop on other tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            assert.equal(capabilities.device_type(caps), 'desktop');
        });
    });

    describe('capabilities.os', function() {
        it('handles Mac 10.9 Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:23.0) Gecko/20100101 Firefox/23.0',
            };
            var os = capabilities.detectOS(navigator);
            assert.equal(os.name, 'Mac OS X');
            assert.strictEqual(os.version, 9);
            assert.equal(os.slug, 'mac');
        });

        it('handles Mac 10.10 Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:23.0) Gecko/20100101 Firefox/23.0',
            };
            var os = capabilities.detectOS(navigator);
            assert.equal(os.name, 'Mac OS X');
            assert.strictEqual(os.version, 10);
            assert.equal(os.slug, 'mac');
        });

        it('handles Mac 10.9 Safari', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/7.1.2 Safari/537.85.11',
            };
            var os = capabilities.detectOS(navigator);
            assert.equal(os.name, 'Mac OS X');
            assert.strictEqual(os.version, 9);
            assert.equal(os.slug, 'mac');
        });

        it('handles Windows IE 9', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
            };
            var os = capabilities.detectOS(navigator);
            assert.equal(os.name, 'Windows');
            assert.strictEqual(os.version, undefined);
            assert.equal(os.slug, 'windows');
        });

        it('handles Linux Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
            };
            var os = capabilities.detectOS(navigator);
            assert.equal(os.name, 'Linux');
            assert.strictEqual(os.version, undefined);
            assert.equal(os.slug, 'linux');
        });

        it('handles Android Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Android; Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
            };
            var os = capabilities.detectOS(navigator);
            assert.equal(os.name, 'Android');
            assert.strictEqual(os.version, undefined);
            assert.equal(os.slug, 'android');
        });
    });

    describe('capabilities.webApps', function() {
        var oldMozApps;

        this.beforeEach(function() {
            oldMozApps = navigator.mozApps;
        });

        this.afterEach(function() {
            if (oldMozApps) {
                navigator.mozApps = oldMozApps;
            } else {
                delete navigator.mozApps;
            }
        });

        it('is true when mozApps.install is a function', function(done) {
            navigator.mozApps = {install: function() {}};
            new Squire().require(['core/capabilities'], function(caps) {
                assert(caps.webApps, 'webApps should be on');
                done();
            });
        });

        it('is false when mozApps.install is undefined', function(done) {
            navigator.mozApps = {};
            new Squire().require(['core/capabilities'], function(caps) {
                assert(!caps.webApps, 'webApps should be off');
                done();
            });
        });

        it('is false when mozApps is undefined', function(done) {
            // It appears as though you can't delete this...
            navigator.mozApps = undefined;
            new Squire().require(['core/capabilities'], function(caps) {
                assert(!caps.webApps, 'webApps should be off');
                done();
            });
        });

        it('is true when settings.mockWebApps is true', function(done) {
            // It appears as though you can't delete this...
            navigator.mozApps = undefined;
            new Squire()
            .mock('core/settings', {mockWebApps: true, switches: []})
            .require(['core/capabilities'], function(caps) {
                assert(caps.webApps, 'webApps should be on');
                done();
            });
        });

        it('changes when settings.mockWebApps changes', function(done) {
            // It appears as though you can't delete this...
            navigator.mozApps = undefined;
            var settings = {mockWebApps: true, switches: []};
            new Squire()
            .mock('core/settings', settings)
            .require(['core/capabilities'], function(caps) {
                assert(caps.webApps, 'webApps should be on');
                settings.mockWebApps = false;
                assert(!caps.webApps, 'webApps should be off');
                done();
            });
        });

        it('works without Object.defineProperty', function(done) {
            navigator.mozApps = {install: function() {}};
            var oldDefineProperty = Object.defineProperty;
            Object.defineProperty = undefined;
            new Squire().require(['core/capabilities'], function(caps) {
                assert(caps.webApps, 'webApps should be on');
                Object.defineProperty = oldDefineProperty;
                done();
            });
        });
    });

    describe('capabilities.packagedWebApps', function() {
        var oldMozApps;

        this.beforeEach(function() {
            oldMozApps = navigator.mozApps;
        });

        this.afterEach(function() {
            if (oldMozApps) {
                navigator.mozApps = oldMozApps;
            } else {
                delete navigator.mozApps;
            }
        });

        it('is true when mozApps.installPackage is a function', function(done) {
            navigator.mozApps = {installPackage: function() {}};
            new Squire().require(['core/capabilities'], function(caps) {
                assert(caps.packagedWebApps, 'packagedWebApps should be on');
                done();
            });
        });

        it('is false when mozApps.installPackage is undefined', function(done) {
            navigator.mozApps = {};
            new Squire().require(['core/capabilities'], function(caps) {
                assert(!caps.packagedWebApps, 'packagedWebApps should be off');
                done();
            });
        });

        it('is false when mozApps is undefined', function(done) {
            // It appears as though you can't delete this...
            navigator.mozApps = undefined;
            new Squire().require(['core/capabilities'], function(caps) {
                assert(!caps.packagedWebApps, 'packagedWebApps should be off');
                done();
            });
        });

        it('is true when settings.mockWebApps is true', function(done) {
            // It appears as though you can't delete this...
            navigator.mozApps = undefined;
            new Squire()
            .mock('core/settings', {mockWebApps: true, switches: []})
            .require(['core/capabilities'], function(caps) {
                assert(caps.packagedWebApps, 'packagedWebApps should be on');
                done();
            });
        });

        it('changes when settings.mockWebApps changes', function(done) {
            // It appears as though you can't delete this...
            navigator.mozApps = undefined;
            var settings = {mockWebApps: true, switches: []};
            new Squire()
            .mock('core/settings', settings)
            .require(['core/capabilities'], function(caps) {
                assert(caps.packagedWebApps, 'packagedWebApps should be on');
                settings.mockWebApps = false;
                assert(!caps.packagedWebApps, 'packagedWebApps should be off');
                done();
            });
        });

        it('works without Object.defineProperty', function(done) {
            navigator.mozApps = {installPackage: function() {}};
            var oldDefineProperty = Object.defineProperty;
            Object.defineProperty = undefined;
            new Squire().require(['core/capabilities'], function(caps) {
                assert(caps.packagedWebApps, 'packagedWebApps should be on');
                Object.defineProperty = oldDefineProperty;
                done();
            });
        });
    });
});
