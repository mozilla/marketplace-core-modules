(function() {
var a = require('assert');
var _ = require('underscore');
var assert = a.assert;
var eq_ = a.eq_;
var eeq_ = a.eeq_;
var feq_ = a.feq_;
var mock = a.mock;

test('capabilities device_platform', function(done, fail) {
    mock(
        'capabilities',
        {
            settings: {
            }
        },
        function (capabilities) {
            capabilities.firefoxOS = true;
            eq_(capabilities.device_platform(), 'firefoxos');

            capabilities.firefoxOS = false;
            capabilities.firefoxAndroid = true;
            eq_(capabilities.device_platform(), 'android');

            capabilities.firefoxAndroid = false;
            eq_(capabilities.device_platform(), 'desktop');
            done();
        },
        fail
    );
});

test('capabilities device_formfactor', function(done, fail) {
    mock(
        'capabilities',
        {
            settings: {
            }
        },
        function (capabilities) {
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
            done();
        },
        fail
    );
});

test('capabilities device_type', function(done, fail) {
    mock(
        'capabilities',
        {
            settings: {}
        },
        function (capabilities) {
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
            done();
        },
        fail
    );
});

})();
