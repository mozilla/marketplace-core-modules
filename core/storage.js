/*
    Interface to localStorage.

    - Automatically serializes and deserializes JSON.
    - Has handler for when localStorage gets full.
*/
define('core/storage', [], function() {
    'use strict';

    function mapKey(key) {
        // Used to have storage versioning. Was removed since not needed.
        return '0::' + key;
    }

    return {
        clear: function() {
            localStorage.clear();
        },
        getItem: function(key) {
            var value = localStorage.getItem(mapKey(key));
            // Handle nulls, maybe other stray values.
            try {
                return JSON.parse(value);
            } catch(e) {
                return value;
            }
        },
        removeItem: function(key) {
            localStorage.removeItem(mapKey(key));
        },
        setItem: function(key, value) {
            try {
                localStorage.setItem(mapKey(key), JSON.stringify(value));
            } catch (e) {
                // Clear localStorage if the quota was reached.
                if (e.name == 'QuotaExceededError' ||
                    e.name == 'NS_ERROR_DOM_QUOTA_REACHED') {
                    require('core/log')('storage').log('LS full, clearing');
                    localStorage.clear();
                    require('core/z').doc.trigger('storage--full-cleared');
                    require('core/views').reload();
                }
            }
        }
    };
});
