/*
    The meat of the "framework".
    Handles page building including defer blocks (fragment loading),
    rendering, in-place pagination.
*/
define('core/builder',
    ['core/log', 'core/nunjucks', 'core/models', 'core/requests',
     'core/settings', 'core/z', 'core/nunjucks.compat', 'jquery'],
    function(log, nunjucks, models, requests,
             settings, z, nunjucksCompat, $) {
    'use strict';
    var logger = log('builder');

    var SafeString = nunjucks.require('runtime').SafeString;
    var counter = 0;

    var page = document.getElementById('page');
    if (!page) {
        logger.error('Could not start the builder; #page not found!');
        return;
    }

    function render(template, context, env) {
        z.page.trigger('builder--pre-render');
        var result = (env || nunjucks.env).render(template, context || {});
        z.page.trigger('builder--post-render');
        return result;
    }

    var error_template = '<h1>error</h1>';  // render(settings.fragment_error_template);

    function parse_and_find(snippet, selector) {
        var dom = document.implementation.createHTMLDocument('');
        dom.body.innerHTML = snippet;
        return dom.body.querySelector(selector);
    }

    function parse_and_replace(snippet, to_replace) {
        var dom = document.implementation.createHTMLDocument('');
        dom.body.innerHTML = snippet;
        var parent = to_replace.parentNode;
        while (dom.body.childNodes.length) {
            var child = dom.body.childNodes[0];
            dom.body.removeChild(child);
            parent.insertBefore(child, to_replace);
        }
        parent.removeChild(to_replace);
    }

    function fire(el, event_name, data) {
        $(el).trigger(event_name, data);
    }

    function Builder() {
        var env = this.env = new nunjucks.Environment([], {autoescape: true});
        env.dev = nunjucks.env.dev;
        env.cache = nunjucks.templates;

        // To retrieve results from the view.
        var result_map = this.results = {};
        var result_handlers = {};

        var has_cached_elements = false;

        var pool = requests.pool();

        function make_paginatable(injector, placeholder, target) {
            if (!placeholder) {
                logger.log('No element to paginate');
                return;
            }

            var el = placeholder.querySelector('.loadmore button');
            if (!el) {
                return;
            }

            el.addEventListener('click', function() {
                el.parentNode.classList.add('loading');
                el.parentNode.classList.remove('pagination-error');
                // Call injector to load next page's URL into `li`.
                // `target` is selector to extract from newly built HTML to
                // inject into the currently visible page.
                var url = el.getAttribute('data-url');
                injector(url, el.parentNode, target).done(function() {
                    logger.log('Pagination completed');
                    fire(page, 'loaded_more');
                }).fail(function() {
                    url += (url.indexOf('?') + 1 ? '&' : '?') + '_bust=' + (new Date()).getTime();
                    parse_and_replace(
                        render(settings.pagination_error_template, {
                            more_url: url
                        }),
                        el.parentNode
                    );
                    make_paginatable(injector, placeholder, target);
                    fire(page, 'builder-pagination-failed', {url: url});
                });
            }, false);
        }

        function trigger_fragment_loaded(data) {
            fire(page, 'fragment_loaded', data);

        }
        function trigger_fragment_load_failed(data) {
            fire(page, 'fragment_load_failed', data);
        }

        function storeModelData(data, as) {
            if (typeof as === 'function') {
                data.forEach(function(obj) {
                    models(as(obj)).cast(obj);
                });
            } else {
                models(as).cast(data);
            }
        }

        // Defer blocks.
        // Adds a custom Nunjucks extension. Nunjucks compiler had to be hacked
        // to allow this (in mozilla/commonplace).
        this.env.addExtension('defer', {
            run: function(context, signature, body, placeholder, empty, except) {
                var uid = 'ph_' + counter++;
                var out;

                var injector = function(url, replace, extract) {
                    var request;
                    if ('as' in signature && 'key' in signature) {
                        request = models(signature.as).get(url, signature.key, pool.get);
                    } else {
                        request = pool.get(url, !!signature.nocache);
                    }

                    if ('id' in signature) {
                        result_handlers[signature.id] = request;
                        request.done(function(data) {
                            result_map[signature.id] = data;
                        });
                    }

                    function get_result(data, dont_cast) {
                        // `pluck` pulls val out of response (this=this.pluck).
                        if ('pluck' in signature) {
                            data = data[signature.pluck];
                        }
                        // `as` passes data to models for caching.
                        if (data && !dont_cast && 'as' in signature) {
                            logger.groupCollapsed('Casting ' + signature.as + 's to model cache...');
                            storeModelData(data, signature.as);
                            logger.groupEnd();
                        }

                        var content = '';
                        if (empty && (!data || Array.isArray(data) && data.length === 0)) {
                            content = empty();
                        } else {
                            context.ctx.this = data;
                            content = body();
                        }

                        if (extract) {
                            try {
                                content = parse_and_find(content, extract).innerHTML;
                            } catch (e) {
                                logger.error('Error extracting result from rendered response.');
                                content = error_template;
                            }
                        }
                        return content;
                    }

                    if (request.__cached) {
                        has_cached_elements = true;

                        var rendered;
                        // request will run sync since it is cached.
                        request.done(function(data) {
                            context.ctx.response = data;
                            rendered = get_result(data, true);

                            // Update the response with vals from model cache
                            // (bug 870447).
                            if (data && 'as' in signature) {
                                var resp = data;
                                var plucked = 'pluck' in signature;
                                var uncaster = function(obj) {
                                    if (typeof signature.as === 'function') {
                                        return models(signature.as(obj)).uncast(obj);
                                    } else {
                                        return models(signature.as).uncast(obj);
                                    }
                                };

                                if (plucked) {
                                    resp = resp[signature.pluck];
                                }
                                if (!resp) {
                                    return;
                                }
                                if (Array.isArray(resp)) {
                                    for (var i = 0; i < resp.length; i++) {
                                        resp[i] = uncaster(resp[i]);
                                    }
                                } else if (plucked) {
                                    data[signature.pluck] = uncaster(resp);
                                }
                                // else: can't model cache requests with no
                                // pluck and aren't an array. :(

                                storeModelData(resp, signature.as);
                            }
                        });

                        if (replace) {
                            parse_and_replace(rendered, replace);
                        } else {
                            out = rendered;
                        }

                        if (signature.paginate) {
                            pool.done(function() {
                                setTimeout(function() {
                                    make_paginatable(injector, document.getElementById(uid), signature.paginate);
                                });
                            });
                        }

                        return request;
                    }

                    request.done(function(data) {
                        var el = document.getElementById(uid);
                        if (!el) {
                            return;
                        }

                        context.ctx.response = data;
                        var content = get_result(data);
                        if (replace) {
                            parse_and_replace(content, replace);
                        } else {
                            el.innerHTML = content;
                        }

                        if (signature.paginate) {
                            make_paginatable(injector, el, signature.paginate);
                        }

                        trigger_fragment_loaded({context: context,
                                                 signature: signature});

                    }).fail(function(xhr, text, code, response) {
                        if (!replace) {
                            var el = document.getElementById(uid);
                            if (!el) {
                                return;
                            }
                            context.ctx.response = response;
                            context.ctx.error = code;
                            el.innerHTML = except ? except() : error_template;
                        }
                        trigger_fragment_load_failed({context: context,
                                                      signature: signature});
                    });
                    return request;
                };

                injector(signature.url);

                if (!out) {
                    out = '<div class="loading">' +
                        (placeholder ? placeholder() : '') +
                    '</div>';
                }
                return new SafeString('<div id="' + uid + '" class="placeholder">' +
                    out +
                '</div>');
            }
        });

        this.env.addExtension('fetch', {
            run: function(context, signature, body) {
                var url = signature.url;

                var request = pool.get(url);
                var uid = 'f_' + counter++;
                var out = '';

                if (request.__cached) {
                    has_cached_elements = true;
                    // This will run synchronously.
                    request.done(function(data) {
                        out = data;
                    });
                } else {
                    var done = function(data) {
                        if (signature.filters) {
                            signature.filters.forEach(function(filterName) {
                                data = env.filters[filterName](data);
                            });
                        }
                        document.getElementById(uid).innerHTML = data;
                    };
                    request.done(done).fail(function() {
                        var fallback = signature.fallback;
                        if (fallback && fallback !== url) {
                            request = pool.get(fallback).done(done).fail(function() {
                                done(error_template);
                            });
                        }
                    });
                }
                if (!out) {
                    out = body();
                }

                return new SafeString('<div id="' + uid + '" class="placeholder fetchblock">' + out + '</div>');
            }
        });

        this.start = function(template, defaults) {
            fire(page, 'build_start');
            page.innerHTML = render(template, defaults, env);
            if (has_cached_elements) {
                trigger_fragment_loaded();
            }

            return this;
        };

        this.onload = function(id, callback) {
            result_handlers[id].done(callback);
            return this;
        };

        pool.promise(this);
        this.terminate = pool.abort;

        this.finish = function() {
            pool.always(function() {
                fire(page, 'loaded');
            });
            pool.finish();
        };

        // Create a closure that constructs a new context only when it's needed.
        var context = (function () {
            var context;
            return function() {
                return context || (context = z.context = {});
            };
        })();

        this.z = function(key, val) {
            context()[key] = val;
            switch (key) {
                case 'title':
                    if (!val) {
                        val = settings.title_suffix;
                    } else if (val !== settings.title_suffix) {
                        val += ' | ' + settings.title_suffix;
                    }
                    document.title = val;
                    break;
                case 'type':
                    document.body.setAttribute('data-page-type', val);
                    break;
            }
        };
    }

    var last_builder;
    return {
        getBuilder: function() {
            if (last_builder) {
                fire(page, 'unloading');
                last_builder.terminate();
            }
            last_builder = new Builder();
            return last_builder;
        },
        getLastBuilder: function() {
            return last_builder;
        }
    };

});
