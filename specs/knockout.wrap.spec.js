/// <reference path="content/jasmine.js" />
/// <reference path="content/sinon-1.4.2.js" />
/// <reference path="../lib/knockout-2.2.1.js" />
/// <reference path="../lib/underscore-min.js" />
/// <reference path="../src/knockout.wrap.js" />

describe('Knockout.wrap', function () {
    var _spec = this;

    beforeEach(function () {
        _spec.obs = ko.observable(10);

        _spec.called = 0;
        _spec.fn = function () {
            _spec.called++;
            return 10 + _spec.obs();
        }
    })

    it('should watch function with observables inside for changes', function () {
        var wrapped = ko.wrap(_spec.fn);
        var spy = sinon.spy();
        wrapped.subscribe(spy);

        expect(spy).not.toHaveBeenCalled();
        wrapped();

        _spec.obs(11);
        expect(spy).toHaveBeenCalled();
    });

    it('should not update if observable inside function doesn\'t change', function () {
        var wrapped = ko.wrap(_spec.fn);
        var spy = sinon.spy();
        wrapped.subscribe(spy);

        expect(spy).not.toHaveBeenCalled();
        wrapped();

        _spec.obs(10);
        expect(spy).not.toHaveBeenCalled();
    });

    it('should not update until wrapped function is initially called', function () {
        var wrapped = ko.wrap(_spec.fn);
        var spy = sinon.spy();
        wrapped.subscribe(spy);

        expect(spy).not.toHaveBeenCalled();
        _spec.obs(11);
        expect(spy).not.toHaveBeenCalled();

        wrapped();
        _spec.obs(10);
        expect(spy).toHaveBeenCalled();
    })
});
