define(['assert', 'underscore', 'capabilities'], function(a, _, capabilities) {
    var assert = a.assert;
    var eq_ = a.eq_;
    var eeq_ = a.eeq_;
    var feq_ = a.feq_;

    describe('capabilities', function() {
        it('capabilities device_platform', function() {
            capabilities.firefoxOS = true;
            eq_(capabilities.device_platform(), 'firefoxos');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = true;
            eq_(capabilities.device_platform(), 'android');

            capabilities.firefoxAndroid = false;
            eq_(capabilities.device_platform(), 'desktop');
        });

        it('capabilities device_formfactor', function() {
            capabilities.firefoxOS = true;
            capabilities.widescreen = function() { return false; };
            eq_(capabilities.device_formfactor(), '');

            capabilities.firefoxOS = true;
            // Firefox OS "tablet" size is not currently supported/differenciated from mobile.
            capabilities.widescreen = function() { return true; };
            eq_(capabilities.device_formfactor(), '');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = true;
            capabilities.widescreen = function() { return false; };
            eq_(capabilities.device_formfactor(), 'mobile');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = true;
            capabilities.widescreen = function() { return true; };
            eq_(capabilities.device_formfactor(), 'tablet');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = false;
            capabilities.widescreen = function() { return false; };
            eq_(capabilities.device_formfactor(), '');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = false;
            capabilities.widescreen = function() { return true; };
            eq_(capabilities.device_formfactor(), '');
        });

        it('capabilities device_type', function() {
            capabilities.firefoxOS = true;
            capabilities.widescreen = function() { return false; };
            eq_(capabilities.device_type(), 'firefoxos');

            // Firefox OS "tablet" size is not currently supported/differenciated from mobile.
            capabilities.widescreen = function() { return true; };
            eq_(capabilities.device_type(), 'firefoxos');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = true;
            capabilities.widescreen = function() { return false; };
            eq_(capabilities.device_type(), 'android-mobile');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = true;
            capabilities.widescreen = function() { return true; };
            eq_(capabilities.device_type(), 'android-tablet');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = false;
            capabilities.widescreen = function() { return false; };
            eq_(capabilities.device_type(), 'desktop');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = false;
            capabilities.widescreen = function() { return true; };
            eq_(capabilities.device_type(), 'desktop');
        });

        it('capabilities.os Mac 10.9 Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:23.0) Gecko/20100101 Firefox/23.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Mac OS X');
            eeq_(os.version, 9);
            eq_(os.slug, 'mac');
        });

        it('capabilities.os Mac 10.10 Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:23.0) Gecko/20100101 Firefox/23.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Mac OS X');
            eeq_(os.version, 10);
            eq_(os.slug, 'mac');
        });

        it('capabilities.os Mac 10.9 Safari', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/7.1.2 Safari/537.85.11',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Mac OS X');
            eeq_(os.version, 9);
            eq_(os.slug, 'mac');
        });

        it('capabilities.os Windows IE 9', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Windows');
            eeq_(os.version, undefined);
            eq_(os.slug, 'windows');
        });

        it('capabilities.os Linux Firefox', function() {
            var navigator = {
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
            };
            var os = capabilities.detectOS(navigator);
            eq_(os.name, 'Linux');
            eeq_(os.version, undefined);
            eq_(os.slug, 'linux');
        });

        it('capabilities.os Android Firefox', function() {
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
