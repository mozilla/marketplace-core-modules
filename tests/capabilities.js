define('tests/capabilities',
        ['assert', 'capabilities'],
        function(a, capabilities) {
    var eq_ = a.eq_;
    var eeq_ = a.eeq_;

    describe('capabilities.device_platform', function() {
        it('can be firefoxos', function() {
            var caps = {firefoxOS: true};
            eq_(capabilities.device_platform(caps), 'firefoxos');
        });

        it('can be android', function() {
            var caps = {firefoxOS: false, firefoxAndroid: true};
            eq_(capabilities.device_platform(caps), 'android');
        });

        it('can be desktop', function() {
            var caps = {firefoxAndroid: false};
            eq_(capabilities.device_platform(caps), 'desktop');
        });
    });

    describe('capabilities.device_formfactor', function() {
        it('is nothing for firefoxOS mobile', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            eq_(capabilities.device_formfactor(caps), '');
        });

        it('is nothing for firefoxOS tablet', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            eq_(capabilities.device_formfactor(caps), '');
        });

        it('is mobile for Android mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return false; },
            };
            eq_(capabilities.device_formfactor(caps), 'mobile');
        });

        it('is tablet for Android tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return true; },
            };
            eq_(capabilities.device_formfactor(caps), 'tablet');
        });

        it('is nothing for other mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            eq_(capabilities.device_formfactor(caps), '');
        });

        it('is nothing for other tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            eq_(capabilities.device_formfactor(caps), '');
        });
    });

    describe('capabilities.device_type', function() {
        it('is firefoxos on FirefoxOS mobile', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            eq_(capabilities.device_type(caps), 'firefoxos');
        });

        it('is firefoxOS on FirefoxOS tablet', function() {
            var caps = {
                firefoxOS: true,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            eq_(capabilities.device_type(caps), 'firefoxos');
        });

        it('is android-mobile on Android mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return false; },
            };
            eq_(capabilities.device_type(caps), 'android-mobile');
        });

        it('is android-tablet on Android tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: true,
                widescreen: function() { return true; },
            };
            eq_(capabilities.device_type(caps), 'android-tablet');
        });

        it('is desktop on other mobile', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return false; },
            };
            eq_(capabilities.device_type(caps), 'desktop');
        });

        it('is desktop on other tablet', function() {
            var caps = {
                firefoxOS: false,
                firefoxAndroid: false,
                widescreen: function() { return true; },
            };
            eq_(capabilities.device_type(caps), 'desktop');
        });
    });

    describe('capabilities.os', function() {
        it('handles Mac 10.9 Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:23.0) Gecko/20100101 Firefox/23.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Mac OS X');
            eeq_(os.version, 9);
            eq_(os.slug, 'mac');
        });

        it('handles Mac 10.10 Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:23.0) Gecko/20100101 Firefox/23.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Mac OS X');
            eeq_(os.version, 10);
            eq_(os.slug, 'mac');
        });

        it('handles Mac 10.9 Safari', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/7.1.2 Safari/537.85.11',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Mac OS X');
            eeq_(os.version, 9);
            eq_(os.slug, 'mac');
        });

        it('handles Windows IE 9', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Windows');
            eeq_(os.version, undefined);
            eq_(os.slug, 'windows');
        });

        it('handles Linux Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Linux');
            eeq_(os.version, undefined);
            eq_(os.slug, 'linux');
        });

        it('handles Android Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Android; Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Android');
            eeq_(os.version, undefined);
            eq_(os.slug, 'android');
        });
    });

});
