(function (ko, _) {
    
    /**
     * knockout.collection
     * 
     * Create an observable collection
     * that performs lightweight operations on 
     * a given parent observable array
     * 
     * @param {observableArray} array to work with
     * @param {String|Function} [id] attribute name or function
     * @return {collection}
     */
    var collection = function (array, key) {
        // Setup new collection
        var collection = ko.observableArray(array());

        // Store underlying array, id, and other helpers
        collection._underlying = array;
        collection._key = key;

        // Add methods
        collection.filter = filter;
        collection.map = map;
        collection.pluck = pluck;

        // Perform actions when array changes
        collection.actions = [];
        collection._subscription = array.subscribe(function (values) {
            updated(collection, values);
        });

        // Keys
        collection.keys = getKeys(array(), key);

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
            keys: getKeys(values, collection._key)
        };
        
        // Perform each action
        _.each(collection.actions, function (action) {
            // Perform action using result of previous
            results = action(results);
        });

        // Update collection value with result
        patch(collection, results);
    }


    /**
     * Helper for creating actions
     * 
     * @param {Function} action to apply to collection
     */
    var action = collection._action = function (action) {
        return function () {
            var args = _.toArray(arguments),
                context = this;

            // Define wrapped action
            var wrapped = function (collection) {
                return action.apply(context, [collection].concat(args));
            };

            // Store wrapped action for value updates
            this.actions.push(wrapped);

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
    var filter = action(function (collection, iterator) {
        var filteredkeys = [];
        var results = _.filter(collection.values, function (item, index) {
            var keep = iterator(item, index);
            if (keep) {
                filteredkeys.push(collection.keys[index]);
            }
            return keep;
        });
        
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
    var map = action(function (collection, iterator) {
        var results = _.map(collection.values, iterator);

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
    var pluck = action(function (collection, propertyName) {
        var results = _.pluck(collection.values, propertyName);

        return {
            values: results,
            keys: collection.keys
        };
    });


    /** 
     * Patch collection with new values
     *
     * @param {observableArray} collection
     * @param {Array} values
     */
    var patch = collection._patch = function (collection, updated) {
        if (!_.isUndefined(collection()) && !_.isUndefined(collection._key)) {
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
