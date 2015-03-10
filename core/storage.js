define('core/storage',
    ['core/settings'],
    function(settings) {
    'use strict';

    console.log("STORAGE INITIALISING WITH ITEM COUNT: " + localStorage.length);

    function FakeStorage() {
        this.store = {};
    }

    FakeStorage.prototype.getItem = function(key) {
        return this.store[key];
    };

    FakeStorage.prototype.setItem = function(key, value) {
        this.store[key] = value;
    };

    FakeStorage.prototype.removeItem = function(key) {
        delete this.store[key];
    };

    FakeStorage.prototype.clear = function() {
        this.store = {};
    };

    var ls;
    try {
        ls = localStorage;
    } catch(e) {
        ls = new FakeStorage();
    }

    function mapKey(key) {
        return settings.storage_version + '::' + key;
    }

    // Expose storage version (which is prefixed to every key).
    // For instance, used in Zamboni login.js.
    ls.setItem('latestStorageVersion', settings.storage_version);

    return {
        clear: function() {
            ls.clear();
        },
        getItem: function(key) {
            var value = ls.getItem(mapKey(key));
            // Handle nulls, maybe other stray values.
            try {
                return JSON.parse(value);
            } catch(e) {
                return value;
            }
        },
        removeItem: function(key) {
            ls.removeItem(mapKey(key));
        },
        setItem: function(key, value) {
            try {
                ls.setItem(mapKey(key), JSON.stringify(value));
            } catch (e) {
                // Clear localStorage if the quota was reached.
                if (e.name == 'QuotaExceededError' ||
                    e.name == 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.log('LocalStorage full, clearing and reloading');
                    ls.clear();
                    require('core/views').reload();
                }
            }
        }
    };
});
