(function (ko, _) {
    
    /**
     * knockout.LiveCollection
     * 
     * Create an observable collection
     * that performs lightweight operations on 
     * a given parent observable array
     * 
     * @param {observableArray} array to work with
     * @return {LiveCollection}
     */
    var LiveCollection = function (array) {
        // Setup new LiveCollection
        var LiveCollection = ko.observableArray(array());
        
        // Add methods
        LiveCollection.filter = filter;
        LiveCollection.map = map;
        LiveCollection.pluck = pluck;

        // Perform actions when array changes
        LiveCollection.actions = [];
        var subscription = array.subscribe(function (value) {
            // Save initial value as result
            var result = value;

            // Perform each action
            _.each(LiveCollection.actions, function (action) {
                // Perform action using result of previous
                result = action(result);
            });

            // Update collection value with result
            LiveCollection(result);
        });

        return LiveCollection;
    };


    var action = function (action) {
        return function () {
            var args = _.toArray(arguments),
                context = this;

            // Define wrapped action
            var wrapped = function (array) {
                return action.apply(context, [array].concat(args));
            };

            // Store wrapped action for value updates
            this.actions.push(wrapped);

            // Update current value
            this( wrapped(this()) );

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
    var filter = action(function (array, iterator) {
        return _.filter(array, iterator);
    });


    /**
     * Map the collection
     *
     * @param {Function} iterator
     */
    var map = action(function (array, iterator) {
        return _.map(array, iterator);
    });


    /**
     * Pluck values for each item in collection
     *
     * @param {String} propertyName
     */
    var pluck = action(function (array, propertyName) {
        return _.pluck(array, propertyName);
    })




    ko.LiveCollection = LiveCollection;

})(ko, _);