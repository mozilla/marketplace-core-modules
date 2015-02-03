define('tests/navigation', ['assert', 'navigation'], function(a, navigation) {
  var assert = a.assert;
  var eq_ = a.eq_;

  describe('navigation url extraction', function() {
      it('drops the src query arg', function() {
          withSettings({param_whitelist: ['q']}, function() {
              eq_(navigation.extract_nav_url('/foo/bar?src=all-popular'), '/foo/bar');
              eq_(navigation.extract_nav_url('/foo/bar?src=all-popular&q=bar'), '/foo/bar?q=bar');
          });
      });
  });
});
