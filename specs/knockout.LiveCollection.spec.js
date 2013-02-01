/// <reference path="../lib/jasmine.js" />
/// <reference path="../lib/sinon-1.4.2.js" />
/// <reference path="../lib/knockout-2.2.1.js" />
/// <reference path="../lib/underscore-min.js" />
/// <reference path="../src/knockout.LiveCollection.js" />

describe('Knockout.LiveCollection', function () {
    var _spec = this;

    describe('Filter', function () {
        beforeEach(function () {
            _spec.data = ko.observableArray([1, 2, 3, 4, 5]);
            _spec.collection = ko.LiveCollection(_spec.data);
        })

        it('should filter simple array', function () {
            var evens = _spec.collection.filter(function (item) {
                return item % 2 == 0;
            });
            
            expect(evens().length).toEqual(2);
            expect(evens()).toEqual([2, 4]);
        });

        it('should update filtered when parent updates', function () {
            var evens = _spec.collection.filter(function (item) {
                return item % 2 == 0;
            });
            
            expect(evens().length).toEqual(2);
            _spec.data.push(6);
            expect(evens().length).toEqual(3);
        });

        it('should return empty array if all filtered', function () {
            var negatives = _spec.collection.filter(function (item) {
                return item < 0;
            });

            expect(negatives().length).toEqual(0);
            expect(negatives()).toEqual([]);
        });
    });

    describe('Map', function () {
        beforeEach(function () {
            _spec.data = ko.observableArray([1, 2, 3]);
            _spec.collection = ko.LiveCollection(_spec.data);
        });
        
        it('should map simple array', function () {
            var mapped = _spec.collection.map(function (item) {
                return 'A' + item;
            });

            expect(mapped().length).toEqual(3);
            expect(mapped()).toEqual(['A1', 'A2', 'A3']);
        });

        it('should update mapped when parent updates', function () {
            var mapped = _spec.collection.map(function (item) {
                return 'A' + item;
            });

            expect(mapped().length).toEqual(3);
            _spec.data.push(4);
            expect(mapped().length).toEqual(4);
            expect(mapped()[3]).toEqual('A4');
        });
    });

    describe('Pluck', function () {
        beforeEach(function () {
            _spec.data = ko.observableArray([
                { message: 'Howdy' }, 
                { message: 'Hi' }, 
                { message: 'Hello' }
            ]);
            _spec.collection = ko.LiveCollection(_spec.data);
        });
        
        it('should pluck from simple objects', function () {
            var plucked = _spec.collection.pluck('message');

            expect(plucked().length).toEqual(3);
            expect(plucked()).toEqual(['Howdy', 'Hi', 'Hello']);
        });

        it('should update plucked when parent updates', function () {
            var plucked = _spec.collection.pluck('message');

            expect(plucked().length).toEqual(3);
            _spec.data.push({ message: 'Hola' });
            expect(plucked().length).toEqual(4);
            expect(plucked()[3]).toEqual('Hola');
        });
    });

    describe('Chaining', function () {
        it('should chain in order', function () {
            _spec.data = ko.observableArray([1, 2, 3, 4, 5]);
            _spec.collection = ko.LiveCollection(_spec.data);

            var filtered = _spec.collection.filter(function (item) {
                return item > 2;
            }).filter(function (item) {
                return item > 1;
            });

            expect(filtered().length).toEqual(3);
        });

        it('should update collection observable only once when updated', function () {
            _spec.data = ko.observableArray([1, 2, 3, 4, 5]);
            _spec.collection = ko.LiveCollection(_spec.data);

            var filtered = _spec.collection.filter(function (item) {
                return item > 2;
            }).filter(function (item) {
                return item > 1;
            });

            var spy = sinon.spy();
            filtered.subscribe(spy);

            _spec.data.push(6);
            expect(spy).toHaveBeenCalledOnce();
        })
    });

})