define('tests/login',
    ['core/login'],
    function(login) {

    describe('login.fxa_redirect_url', function() {
        it('is the signin url when not registering', function() {
            withSettings({fxa_auth_url: 'https://fxa.com/auth'}, function() {
                assert.equal(login.fxa_redirect_url(),
                             'https://fxa.com/auth?action=signin');
            });
        });

        it('is the register url when registering', function() {
            withSettings({fxa_auth_url: 'https://fxa.com/auth'}, function() {
                assert.equal(login.fxa_redirect_url({register: true}),
                             'https://fxa.com/auth?action=signup');
            });
        });
    });
});
