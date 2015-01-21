define('views/tests', ['assert', 'requests'], function(assert, requests) {
    return function(builder) {
        var started = 0;
        var passed = 0;
        var failed = 0;
        var skipped = 0;

        function is_done() {
            var ndone = passed + failed;
            var progress = $('progress');
            progress.attr('value', ndone / started);
            if (ndone === started) {
                console.log('Tests completed.');
                $('<b>Completed ' + ndone + ' tests.</b>').insertAfter(progress);
            }
        }

        window.test = function(name, runner, cleanup) {
            started++;
            is_done();
            setTimeout(function() {
                var infobox = $('<li><span style="background-color: gray">Running</span> <b>' + name + '</b></li>');
                infobox.attr('status', 'init');
                infobox.attr('name', name);
                $('ol.tests').append(infobox);
                var completion = function() {
                    passed++;
                    $('#c_passed').text(passed);
                    infobox.attr('status', 'pass').find('span').text('Passed').css('background-color', 'lime');
                    is_done();
                    if (cleanup) cleanup();
                };
                var has_failed = function(message) {
                    console.error(name, message);
                    failed++;
                    infobox.attr('status', 'fail').find('span').html('Failed<br>' + message).css('background-color', 'pink');
                    $('#c_failed').text(failed);
                    if (cleanup) cleanup();
                };
                try {
                    console.log('Starting ' + name);
                    infobox.attr('status', 'stall').find('span').text('Started').css('background-color', 'goldenrod');
                    runner(completion, has_failed);
                } catch (e) {
                    has_failed(e.message);
                }
            }, 0);
            $('#c_started').text(started);
        };

        window.xtest = function(name) {
            skipped++;
            $('#c_skipped').text(skipped);
            console.log('skipping test ' + name);
            setTimeout(function() {
                var infobox = $('<li><span style="background-color: gold">Skipped</span> <b>' + name + '</b></li>');
                infobox.attr('status', 'skip');
                infobox.attr('name', name);
                $('ol.tests').append(infobox);
            }, 0);
        };

        builder.start('tests.html');
        var scripts = document.querySelectorAll('#page script');
        function processor(data) {
            /* jshint ignore:start */
            eval(data);
            /* jshint ignore:end */
        }

        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            requests.get(script.getAttribute('src'), true).done(processor);
        }

        builder.z('type', 'debug');
        builder.z('dont_reload_on_login', true);
        builder.z('title', 'Unit Tests');
    };
});
