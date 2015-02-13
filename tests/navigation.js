define('tests/navigation', ['core/navigation'], function(navigation) {
  describe('navigation url extraction', function() {
      it('drops the src query arg', function() {
          withSettings({param_whitelist: ['q']}, function() {
              assert.equal(navigation.extract_nav_url('/foo/bar?src=all-popular'), '/foo/bar');
              assert.equal(navigation.extract_nav_url('/foo/bar?src=all-popular&q=bar'), '/foo/bar?q=bar');
          });
      });
  });
});
