// knockout.wrapper
// (c) Tim Hall - https://github.com/timhall/knockout.collection
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function (ko, _) {
    
    /**
     * knockout.wrapper
     * 
     * Get a wrapped version of the specified function
     * and notify any subscribers when any observables inside have changed
     * 
     * Basically a ko.computed that doesn't actually calculate on change
     *
     * Useful for expensive functions that only want to know if they should be
     * re-evaluated on change without actually re-evaluating
     *
     * var wrapped = ko.wrapper(function () { somethingExpensive(observable()); });
     * wrapped.subscribe(function () {
     *     // The dependencies have updated,
     *     // do something if you want or not
     * });
     *
     * When you want to do somethingExpensive call wrapped()
     *
     * @param {Function} fn function to watch
     */
    var wrapper = function (fn) {
        if (typeof fn != 'function') {
            throw new Error('Pass a function to wrap');
        }

        var _subscription;
        var wrapped = function () {
            var context = this, 
                args = _.toArray(arguments),
                result;

            // Dispose of existing watcher and subscription
            if (_subscription) { _subscription.dispose(); }

            // Create watcher for function and subscribe to any internal changes
            _subscription = watcher(function () {
                result = fn.apply(context, args);
            }).subscribe(function () {
                wrapped.notifySubscribers(undefined, 'change');
            });

            return result
        }
        ko.subscribable.call(wrapped);

        return wrapped;
    };

    // Attach to knockout object
    ko.wrapper = wrapper;

    /**
     * Watch specified callback for changes
     *
     * Grafted liberally from ko.computed
     * https://github.com/SteveSanderson/knockout
     * (c) Steven Sanderson - http://knockoutjs.com/
     *
     * @param {Function} callback
     * @return {subscribable}
     */
    var watcher = function (callback, context, options) {
        
        var _hasBeenEvaluated = false;
            _isBeingEvaluated = false;
        
        options = options || {};

        if (typeof callback != "function")
            throw new Error("watched requires a function to watch");

        function addSubscriptionToDependency(subscribable) {
            _subscriptionsToDependencies.push(subscribable.subscribe(updated));
        }

        function disposeAllSubscriptionsToDependencies() {
            ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
                subscription.dispose();
            });
            _subscriptionsToDependencies = [];
        }

        function init() {
            if (_isBeingEvaluated) {
                // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
                // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
                // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
                // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
                return;
            }

            // Don't dispose on first evaluation, because the "disposeWhen" callback might
            // e.g., dispose when the associated DOM element isn't in the doc, and it's not
            // going to be in the doc until *after* the first evaluation
            if (_hasBeenEvaluated && disposeWhen()) {
                dispose();
                return;
            }

            _isBeingEvaluated = true;
            try {
                // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
                // Then, during evaluation, we cross off any that are in fact still being used.
                var disposalCandidates = ko.utils.arrayMap(_subscriptionsToDependencies, function(item) {return item.target;});

                // Begin dependency detection and specify callback for found dependencies
                dependencyDetection[dependencyBeginName](function(subscribable) {
                    var inOld;
                    if ((inOld = ko.utils.arrayIndexOf(disposalCandidates, subscribable)) >= 0)
                        disposalCandidates[inOld] = undefined; // Don't want to dispose this subscription, as it's still being used
                    else
                        addSubscriptionToDependency(subscribable); // Brand new subscription - add it
                });

                // Call the callback with the given context and watch for dependencies triggered
                callback.call(context);

                // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
                for (var i = disposalCandidates.length - 1; i >= 0; i--) {
                    if (disposalCandidates[i])
                        _subscriptionsToDependencies.splice(i, 1)[0].dispose();
                }
                _hasBeenEvaluated = true;
            } finally {
                dependencyDetection.end();
            }

            updated();
            _isBeingEvaluated = false;
            if (!_subscriptionsToDependencies.length)
                dispose();
        }

        function updated() {
            watcher["notifySubscribers"](undefined);
        }

        function watcher() {
            if (arguments.length > 0) {
                // Write not supported
            } else {
                // Read not supported
            }
        }

        function isActive() {
            return _subscriptionsToDependencies.length > 0;
        }

        // By here, "options" is always non-null
        var dispose = disposeAllSubscriptionsToDependencies,
            _subscriptionsToDependencies = [];

        if (!context)
            context = options["owner"];

        watcher.getDependenciesCount = function () { return _subscriptionsToDependencies.length; };
        watcher.dispose = function () { dispose(); };
        watcher.isActive = isActive;

        ko.subscribable.call(watcher);

        // Initialize (evaluate callback and find dependencies)
        init();

        return watcher;
    }

    // Locate knockout's internal dependency detection
    // From knockout.deferred-updates, 
    // https://github.com/mbest/knockout-deferred-updates)
    // (c) Michael Best, Steven Sanderson
    // ---
    function findNameMethodSignatureContaining(obj, match) {
        for (var a in obj)
            if (obj.hasOwnProperty(a) && obj[a].toString().indexOf(match) >= 0)
                return a;
    }
    function findSubObjectWithProperty(obj, prop) {
        for (var a in obj)
            if (obj.hasOwnProperty(a) && obj[a] && obj[a][prop])
                return obj[a];
    }
    var dependencyDetection = findSubObjectWithProperty(ko, 'end'),
        dependencyBeginName = findNameMethodSignatureContaining(dependencyDetection, '.push({'),
        dependencyRegisterName = findNameMethodSignatureContaining(dependencyDetection, '.length');
    // ---

})(ko, _);