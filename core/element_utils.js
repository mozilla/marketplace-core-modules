/*
    Helpers for Custom Elements.
*/
define('core/element_utils',
    ['core/polyfill'],
    function(polyfill) {
    'use strict';

    function forEach(nodeList, cb) {
        // Node list iteration helper.
        for (var i = 0; nodeList && (i < nodeList.length); i++) {
            cb(nodeList[i], i);
        }
    }

    function MktEvent(eventName, detail) {
        // Returns event that bubbles and is cancelable by default.
        return new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail: detail,
        });
    }

    function toggleClass(element, className, bool) {
        // Helper to toggle classList since different browsers have different
        // behavior if the second argument to classList.toggle is undefined.
        if (bool !== undefined) {
            if (bool) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        } else {
            element.classList.toggle(className);
        }
    }

    function updateActiveNode(element, activeNodeClass, path) {
        // Remove highlights from formerly-active nodes.
        var links = element.querySelectorAll('a.' + activeNodeClass);
        for (var i = 0; links && (i < links.length); i++) {
            links[i].classList.remove(activeNodeClass);
        }

        // Highlight new active nodes based on current page.
        var activeLinks = element.querySelectorAll(
            'a[href="' + (path || window.location.pathname) + '"]');
        for (i = 0; activeLinks && (i < activeLinks.length); i++) {
            activeLinks[i].classList.add(activeNodeClass);
        }
    }

    function proxyInterface(destObj, properties, methods, key) {
        // Proxies destObj.<properties> and destObj.<methods>() to
        // destObj.<key>.
        properties.forEach(function(prop) {
            if (Object.getOwnPropertyDescriptor(destObj, prop)) {
                // Already defined.
                return;
            }
            // Set a property.
            Object.defineProperty(destObj, prop, {
                get: function() {
                    return this[key][prop];
                }
            });
        });

        methods.forEach(function(method) {
            // Set a method.
            Object.defineProperty(destObj, method, {
                value: function() {
                    return this[key][method].call(arguments);
                }
            });
        });
    }

    return {
        forEach: forEach,
        MktEvent: MktEvent,
        toggleClass: toggleClass,
        proxyInterface: proxyInterface,
        updateActiveNode: updateActiveNode
    };
});
