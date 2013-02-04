// knockout.collection
// (c) Tim Hall - https://github.com/timhall/knockout.collection
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function (ko, _) {
    
    /**
     * knockout.collection
     * 
     * Create an observable collection
     * that performs lightweight operations on 
     * a given parent observable array
     * 
     * @param {observableArray} array to work with
     * @param {String|Function|Object} [key|options] attribute name or function for key or options object
     * @return {collection}
     */
    var collection = function (array, options) {
        // Setup new collection
        var collection = ko.observableArray(array());

        // Set options
        if (_.isFunction(options) || _.isString(options)) {
            collection.options = {
                key: options,
                cache: true
            }    
        } else {
            collection.options = _.extend({}, { cache: true }, options);
        }

        // Store underlying array, id, and other internal
        collection._underlying = array;
        collection._subscriptions = [];
        collection._actionId = 0;

        // Add methods
        collection.filter = collection.select = filter;
        collection.map = collection.collect = map;
        collection.pluck = pluck;
        collection.uniq = collection.unique = unique;

        // Store actions
        collection.actions = [];

        // Update when subscription changes
        collection.watch = function (observable) {
            collection._subscriptions.push(observable.subscribe(function () {
                updated(collection, collection._underlying());
            }));
        }

        // Update when underlying array changes
        collection._subscriptions.push(array.subscribe(function (values) {
            updated(collection, values);
        }));

        // Keys
        collection.keys = getKeys(array(), collection.options.key);

        // Cache
        collection._cache = [];
        collection.cache = function (id, value) {
            if (_.isUndefined(value)) {
                return collection._cache[id];
            } else {
                collection._cache[id] = value;
            }
        }

        return collection;
    };


    /**
     * Value updated callback
     *
     * @param {collection}
     * @param {Array} values
     */
    var updated = collection._updated = function (collection, values) {
        // Save initial value as result
        var results = {
            values: values,
            keys: getKeys(values, collection.options.key)
        };
        
        // Perform each action
        _.each(collection.actions, function (action) {
            // Perform action using result of previous
            results = action.action(results);
        });

        // Update collection value with result
        patch(collection, results);
    }


    /**
     * Helpers for creating generic actions
     * 
     * @param {Function} action to apply to collection
     */
    var genericAction = collection._genericAction = function (action) {
        return function () {
            var args = _.toArray(arguments),
                parent = this,
                context = this;

            // Define wrapped action
            var wrapped = function (collection, id) {
                var results = action.apply(parent, [collection, parent.cache(id)].concat(args));
                if (parent.options.cache) { parent.cache(id, results); }
                return results;
            };

            // Store wrapped action for value updates
            this.actions.push({ id: collection._actionId++, action: wrapped });

            // Update current value
            var results = wrapped({ values: this(), keys: this.keys })
            this( results.values );
            this.keys = results.keys;

            // Chain
            return this;
        }
    };

    /**
     * Helpers for creating interated actions
     * 
     * @param {Function} action to apply to collection
     */
    var iteratedAction = collection._iteratedAction = function (action) {
        return function (iterator, context) {
            // Set context
            var parent = this;
            context = context || this;

            // Subscribe to iterator changes
            var iterator = ko.wrapper(iterator);
            this.watch(iterator);

            // Define wrapped action
            var wrapped = function (collection, id) {
                var results = action.call(parent, collection, parent.cache(id), iterator, context);
                if (parent.options.cache) { parent.cache(id, results); }
                return results;
            };

            // Store wrapped action for value updates
            this.actions.push({ id: collection._actionId++, action: wrapped });

            // Update current value
            var results = wrapped({ values: this(), keys: this.keys })
            this( results.values );
            this.keys = results.keys;

            // Chain
            return this;
        }
    };


    /**
     * Filter the collection
     * returning values that pass truth test
     *
     * @param {Function} iterator
     */
    var filter = iteratedAction(function (collection, cache, iterator, context) {
        var filteredkeys = [];
        var results = _.filter(collection.values, function (item, index) {
            var keep = iterator(item, index);
            if (keep) {
                filteredkeys.push(collection.keys[index]);
            }
            return keep;
        }, context);
        
        return {
            values: results,
            keys: filteredkeys
        };
    });


    /**
     * Map the collection
     *
     * @param {Function} iterator
     */
    var map = iteratedAction(function (collection, cache, iterator, context) {
        var results = [],
            key;

        if (!cache) {
            results = _.map(collection.values, iterator, context);
        } else {
            _.each(collection.values, function (item, index) {    
                results.push(
                    needsUpdating(item, index, collection, cache)
                    ? iterator.call(context, item)
                    : cache.values[index]
                );
            })
        }

        return {
            values: results,
            keys: collection.keys
        };
    });


    /**
     * Pluck values for each item in collection
     *
     * @param {String} propertyName
     */
    var pluck = genericAction(function (collection, cache, propertyName) {
        var results = _.pluck(collection.values, propertyName);

        return {
            values: results,
            keys: collection.keys
        };
    });


    /**
     * Get unique values for collection
     */
    var unique = genericAction(function (collection, cache) {
        var results = _.uniq(collection.values);

        return {
            values: results
        };
    });


    var needsUpdating = function (item, index, collection, cache) {
        var key = collection.keys[index],
            cachedItem = cache.values[index];

        return isNew(key, cache.keys) || isUpdated(item, cachedItem);
    }
    var isNew = function (key, cachedKeys) {
        return _.indexOf(cachedKeys, key) < 0;
    }
    var isUpdated = function (item, cachedItem) {
        return !isEqual(item, cachedItem);
    }


    /** 
     * Patch collection with new values
     *
     * @param {observableArray} collection
     * @param {Array} values
     */
    var patch = collection._patch = function (collection, updated) {
        if (!_.isUndefined(collection()) 
            && !_.isUndefined(collection.options.key)
            && (collection.keys && collection.keys.length > 0)
            && (updated.keys && updated.keys.length > 0)) {

            // Remove items
            removeItems(collection, updated);

            // Add items
            addItems(collection, updated);

            // Sort items
            sortItems(collection, updated);

            // Update items
            updateItems(collection, updated);
        } else {
            // No previous value or key, set directly
            collection(updated.values);
        }
    }

    // Remove items
    var removeItems = collection._removeItems = function (collection, updated) {
        var removedKeys = _.difference(collection.keys, updated.keys),
            index;

        _.each(removedKeys, function (key) {
            index = _.indexOf(collection.keys, key)
            collection.splice(index, 1);
            collection.keys.splice(index, 1);
        });
    };

    // Add items
    var addItems = collection._addItems = function (collection, updated) {
        var addedKeys = _.difference(updated.keys, collection.keys),
            index;
        
        _.each(addedKeys, function (key) {
            index = _.indexOf(updated.keys, key);
            collection.splice(index, 0, updated.values[index]);
            collection.keys.splice(index, 0, key);
        })    
    };

    // Sort items
    var sortItems = collection._sortItems = function (collection, updated) {
        var oldIndex;

        _.each(updated.keys, function (key, newIndex) {
            oldIndex = _.indexOf(collection.keys, key);
            
            if (oldIndex != newIndex) {
                // Remove misplaced item and add to proper place
                collection.splice(oldIndex, 1);
                collection.splice(newIndex, 0, updated.values[newIndex]);

                // Update keys
                collection.keys.splice(oldIndex, 1);
                collection.splice(newIndex, 0, key);
            }
        })  
    };

    // Update items
    var updateItems = collection._updateItems = function (collection, updated) {
        _.each(collection(), function (item, index) {
            var value = updated.values[index];
            if (!isEqual(item, value)) {
                collection.splice(index, 1, value);
            }
        });
    };
    
    // Get value for item
    var getValue = collection._getValue = function (item) {
        return _.isFunction(item && item.toJS) 
            ? item.toJS() 
            : ko.toJS(item);
    }

    // Get keys of collection
    var getKeys = collection._getKeys = function (array, key) {
        var getKey = function (item) {
            return _.isFunction(key) 
                ? key(item) 
                : ko.utils.unwrapObservable(item[key]);
        }
        
        return _.map(array, getKey);
    };

    // Check if items are equal
    var isEqual = collection._isEqual = function (itemA, itemB) {
        return _.isEqual(getValue(itemA), getValue(itemB));
    }

    // Add to knockout object
    ko.collection = collection;

})(ko, _);
