/// <reference path="../lib/jasmine.js" />
/// <reference path="../lib/sinon-1.4.2.js" />
/// <reference path="../lib/knockout-2.2.1.js" />
/// <reference path="../lib/underscore-min.js" />
/// <reference path="../src/knockout.collection.js" />

describe('Knockout.collection', function () {
    var _spec = this;

    describe('Filter', function () {
        beforeEach(function () {
            _spec.data = ko.observableArray([1, 2, 3, 4, 5]);
            _spec.collection = ko.collection(_spec.data);
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
            _spec.collection = ko.collection(_spec.data);
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
            _spec.collection = ko.collection(_spec.data);
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
            _spec.collection = ko.collection(_spec.data);

            var filtered = _spec.collection
                .filter(function (item) {
                    return item > 2;
                })
                .filter(function (item) {
                    return item > 1;
                });

            expect(filtered().length).toEqual(3);
        });

        it('should update collection observable only once when updated', function () {
            _spec.data = ko.observableArray([1, 2, 3, 4, 5]);
            _spec.collection = ko.collection(_spec.data);

            var filtered = _spec.collection.filter(function (item) {
                return item > 2;
            }).filter(function (item) {
                return item > 1;
            });

            var spy = sinon.spy();
            filtered.subscribe(spy);

            _spec.data.push(6);
            expect(spy).toHaveBeenCalledOnce();
        });
    });

    describe('Patch', function () {
        beforeEach(function () {
            _spec.collection = ko.collection(ko.observableArray([
                { id: 1, value: 'A' },
                { id: 2, value: 'B' },
                { id: 3, value: 'C' }
            ]), 'id');
        });

        it('should get keys from property name key', function () {
            values = [
                { id: 1, value: 'A' },
                { id: 2, value: 'B' }
            ];

            var keys = ko.collection._getKeys(values, 'id');
            expect(keys).toEqual([1, 2]);
        });

        it('should evaluate key function to get key', function () {
            values = [
                { id: 1, value: 'A' },
                { id: 2, value: 'B' }
            ];

            var keys = ko.collection._getKeys(values, function (item) { return item.id; });
            expect(keys).toEqual([1, 2]);
        });

        it('should not replace entire collection when removing items', function () {
            var updated = {
                values: [{ id: 1, value: 'Updated' }],
                keys: [1]
            }

            ko.collection._removeItems(_spec.collection, updated);
            expect(_spec.collection().length).toEqual(1);
            expect(_spec.collection()[0].value).toEqual('A');
        });

        it('should not replace entire collection when adding items', function () {
            var updated = {
                values: [
                    { id: 1, value: 'Updated' },
                    { id: 4, value: 'New' },
                    { id: 2, value: 'B' },
                    { id: 3, value: 'C' },
                ],
                keys: [1, 2, 3, 4]
            };

            ko.collection._addItems(_spec.collection, updated);
            expect(_spec.collection().length).toEqual(4);
            expect(_spec.collection()[0].value).toEqual('A');
        });

        it('should find simple updates', function () {
            var updated = {
                values: [
                    { id: 3, value: 'Hello' },
                    { id: 2, value: 'World' },
                    { id: 1, value: 'Updated' }
                ],
                keys: [3, 2, 1]
            }

            ko.collection._updateItems(_spec.collection, updated);
            expect(_spec.collection()).toEqual(updated.values);
        });

        it('should sort updated values for collection', function () {
            var updated = {
                values: [
                    { id: 3, value: 'C' },
                    { id: 2, value: 'B' },
                    { id: 1, value: 'A' }
                ],
                keys: [3, 2, 1]
            };

            ko.collection._sortItems(_spec.collection, updated);
            expect(_spec.collection()[0].id).toEqual(3);
        });
    })

})