/// <reference path="content/jasmine.js" />
/// <reference path="content/sinon-1.4.2.js" />
/// <reference path="../lib/knockout-2.2.1.js" />
/// <reference path="../lib/underscore-min.js" />
/// <reference path="../src/knockout.wrapper.js" />

describe('Knockout.wrapper', function () {
    var _spec = this;

    beforeEach(function () {
        _spec.obs = ko.observable(10);

        _spec.called = 0;
        _spec.fn = function () {
            _spec.called++;
            return 10 + _spec.obs();
        }
    })

    it('should return result of inner function', function () {
        var wrapped = ko.wrapper(function () {
            return 2 + 2;
        });

        expect(wrapped()).toEqual(4);
    });

    it('should pass arguments into inner function', function () {
        var wrapped = ko.wrapper(function (a, b) {
            return a + b;
        });

        expect(wrapped(2, 3)).toEqual(5);
    });

    it('should use correct context for inner function', function () {
        var wrapped = ko.wrapper(function () {
            return this.value;
        });

        expect(wrapped.call({ value: 10})).toEqual(10);
    });

    it('should watch function with observables inside for changes', function () {
        var wrapped = ko.wrapper(_spec.fn);
        var spy = sinon.spy();
        wrapped.subscribe(spy);

        expect(spy).not.toHaveBeenCalled();
        wrapped();

        _spec.obs(11);
        expect(spy).toHaveBeenCalled();
    });

    it('should not update if observable inside function doesn\'t change', function () {
        var wrapped = ko.wrapper(_spec.fn);
        var spy = sinon.spy();
        wrapped.subscribe(spy);

        expect(spy).not.toHaveBeenCalled();
        wrapped();

        _spec.obs(10);
        expect(spy).not.toHaveBeenCalled();
    });

    it('should not update until wrapped function is initially called', function () {
        var wrapped = ko.wrapper(_spec.fn);
        var spy = sinon.spy();
        wrapped.subscribe(spy);

        expect(spy).not.toHaveBeenCalled();
        _spec.obs(11);
        expect(spy).not.toHaveBeenCalled();

        wrapped();
        _spec.obs(10);
        expect(spy).toHaveBeenCalled();
    });

    it('should only call wrapped function explicitly', function () {
        var wrapped = ko.wrapper(_spec.fn);

        wrapped();
        expect(_spec.called).toEqual(1);
        _spec.obs(11);
        expect(_spec.called).toEqual(1);

        _spec.obs(10);
        _spec.obs(11);
        _spec.obs(10);
        _spec.obs(11);
        expect(_spec.called).toEqual(1);

        wrapped();
        expect(_spec.called).toEqual(2);

        wrapped();
        _spec.obs(10);
        wrapped();
        _spec.obs(11);
        wrapped();
        _spec.obs(10);
        wrapped();
        _spec.obs(11);
        wrapped();
        expect(_spec.called).toEqual(7);
    })
});
