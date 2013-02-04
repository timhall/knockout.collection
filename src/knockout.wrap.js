// knockout.watch

(function (ko, _) {
    
    /**
     * knockout.wrap
     * 
     * Get a wrapped version of the specified function
     * and notify any subscribers when any observables inside have changed
     * 
     * Basically a ko.computed that doesn't actually calculate on change
     *
     * Useful for expensive functions that only want to know if they should be
     * re-evaluated on change without actually re-evaluating
     *
     * var wrapped = ko.wrap(function () { somethingExpensive(observable()); });
     * wrapped.subscribe(function () {
     *     // The dependencies have updated,
     *     // do something if you want or not
     * });
     *
     * When you want to do somethingExpensive call wrapped()
     *
     * @param {Function} watch function
     */
    var wrap = function (fn) {
        if (typeof fn != 'function') {
            throw new Error('Pass a function to wrap');
        }

        var _watcher, _subscription;
        var wrapped = function () {
            var context = this, 
                args = _.toArray(arguments),
                result;

            // Dispose of existing watcher and subscription
            if (_watcher) { _watcher.dispose(); }
            if (_subscription) { _subscription.dispose(); }

            // Create watcher for function and subscribe to any internal changes
            _watcher = ko.computed(function () {
                result = fn.apply(context, args);
            });
            _subscription = _watcher.subscribe(function () {
                wrapped.notifySubscribers(undefined, 'change');
            });

            return result
        }
        ko.subscribable.call(wrapped);

        return wrapped;
    };

    // Attach to knockout object
    ko.wrap = wrap;

})(ko, _);