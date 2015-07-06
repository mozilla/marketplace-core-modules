define('tests/capabilities',
    ['core/capabilities', 'Squire'],
    function(capabilities, Squire) {

    describe('capabilities.device_platform', function() {
        it('can be firefoxos', function() {
            var caps = {firefoxOS: true, os: {type: ''}};
            assert.equal(capabilities.device_platform(caps), 'firefoxos');
        });

        it('can be android', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                os: {type: 'mobile'},
            };
            assert.equal(capabilities.device_platform(caps), 'android');
        });

        it('can be desktop', function() {
            var caps = {firefoxAndroid: false, os: {type: 'desktop'}};
            assert.equal(capabilities.device_platform(caps), 'desktop');
        });
    });

    describe('capabilities.device_formfactor', function() {
        it('is nothing for firefoxOS mobile', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return false; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_formfactor(caps), '');
        });

        it('is nothing for firefoxOS tablet', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return true; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_formfactor(caps), '');
        });

        it('is mobile for Android mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return false; },
                os: {type: 'mobile'},
            };
            assert.equal(capabilities.device_formfactor(caps), 'mobile');
        });

        it('is tablet for Android tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return true; },
                os: {type: 'mobile'},
            };
            // This becomes tablet because it is widescreen. The Android OS
            // type is always set to `mobile`.
            assert.equal(capabilities.device_formfactor(caps), 'tablet');
        });

        it('is mobile for other mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return false; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_formfactor(caps), 'mobile');
        });

        it('is tablet for other tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return true; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_formfactor(caps), 'tablet');
        });
    });

    describe('capabilities.device_type', function() {
        it('is firefoxos on FirefoxOS mobile', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return false; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_type(caps), 'firefoxos');
        });

        it('is firefoxOS on FirefoxOS tablet', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return true; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_type(caps), 'firefoxos');
        });

        it('is android-mobile on Android mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return false; },
                os: {type: 'mobile'},
            };
            assert.equal(capabilities.device_type(caps), 'android-mobile');
        });

        it('is android-tablet on Android tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return true; },
                os: {type: 'mobile'},
            };
            assert.equal(capabilities.device_type(caps), 'android-tablet');
        });

        it('is android-mobile on other mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return false; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_type(caps), 'android-mobile');
        });

        it('is android-tablet on other tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return true; },
                os: {type: ''},
            };
            assert.equal(capabilities.device_type(caps), 'android-tablet');
        });
    });

    describe('capabilities.os', function() {
        var operatingSystems = [
            {
                description: 'Mac 10.9 Firefox',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:23.0) Gecko/20100101 Firefox/23.0',
                name: 'Mac OS X',
                version: 9,
                slug: 'mac',
                type: 'desktop',
            },
            {
                description: 'Mac 10.10 Firefox',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:23.0) Gecko/20100101 Firefox/23.0',
                name: 'Mac OS X',
                version: 10,
                slug: 'mac',
                type: 'desktop',
            },
            {
                description: 'Mac 10.9 Safari',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/7.1.2 Safari/537.85.11',
                name: 'Mac OS X',
                version: 9,
                slug: 'mac',
                type: 'desktop',
            },
            {
                description: 'Windows IE 9',
                userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
                name: 'Windows',
                version: undefined,
                slug: 'windows',
                type: 'desktop',
            },
            {
                description: 'Linux Firefox',
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
                name: 'Linux',
                version: undefined,
                slug: 'linux',
                type: 'desktop',
            },
            {
                description: 'Android Firefox',
                userAgent: 'Mozilla/5.0 (Android; Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
                name: 'Android',
                version: undefined,
                slug: 'android',
                type: 'mobile',
            },
            {
                description: 'Android Chrome',
                userAgent: 'Mozilla/5.0 (Linux; Android 4.4.4; Nexus 5 Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.114 Mobile Safari/537.36',
                name: 'Android',
                version: undefined,
                slug: 'android',
                type: 'mobile',
            },
            {
                description: 'Windows Phone IE',
                userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 520)',
                name: undefined,
                version: undefined,
                slug: undefined,
                type: undefined,
            },
            {
                description: 'iPhone 6 Safari',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4',
                name: undefined,
                version: undefined,
                slug: undefined,
                type: undefined,
            },
        ];

        operatingSystems.forEach(function(os) {
            it('detects ' + os.description, function() {
                var navigator = {
                    userAgent: os.userAgent,
                };
                var detected = capabilities.detectOS(navigator);
                assert.equal(detected.name, os.name);
                assert.strictEqual(detected.version, os.version);
                assert.equal(detected.slug, os.slug);
                assert.equal(detected.type, os.type);
            });
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
