knockout.collection
===================

knockout.collection is designed to make it much simpler to interact with observable arrays in knockout. 
Filtering, mapping, and other collection helpers have traditionally required quite a bit of plumbing in knockout.
Take the example of filtering a list of messages by sender:

```javascript
// List of raw messages (e.g. from server)
var messages = ko.observableArray([
  { id: 1, subject: 'Hi there!', from: 'Friend' },
  { id: 2, subject: 'Something important', from: 'Boss' },
  { id: 3, subject: 'Lunch?', from: 'Friend' },
  { id: 4, subject: 'Get back to work', from: 'Boss' }
]);
var filterBy = ko.observable('Friend');

// Load initial filtered list
var messagesfromFriend = ko.observableArray(getMessagesFromFriend(messages());

// Update filtered list whenever data or filterBy changes
messages.subscribe(function (newMessages) {
  messagesfromFriend(getMessagesFromFriend(newMessages));
});
filterBy.subscribe(function () {
  messagesfromFriend(getMessagesFromFriend(messages()));
});

// Filter list of messages
var getMessagesFromFriend = function (messages) {
  return _.filter(messages, function (message) {
    return message.from == filterBy();
  });
}
```

This is a pretty simple example of a common application and it could use some improvement, 
namely with knockout.collection:

```javascript
var messagesFromFriend = ko.collection(messages).filter(function (message) {
  return message.from == filterBy();
});
```

And that's it! The collection automatically updates when the messages data or filterBy changes and applies any filters, mapping, and other helpers.

## Patching

In addition to making collections much simpler to interact with, knockout.collection makes the process much more efficient by patching any changes into the resulting collection rather than completely replacing the collection whenever the underlying data changes. You can enable patching by passing in a `key` when creating the collection:

```javascript
// Patching with key parameter
ko.collection(messages, 'id')

// Patching with key function
ko.collection(messages, function (message) {
	return message.id;
});
```

Additionally, keys are pulled from the original data and maintained through each processing step so that steps such as `map` that may not maintain the `key` can still have patched updates.

```javascript
// Even though map gets rid of the key field in the output, 
// changes are still patched based the original data
var shortenedMessages = ko.collection(messages, 'id').map(function (message) {
	return message.from + ' says ' + message.subject;
});
```

## Chaining

knockout.collection also allows multiple processing steps to be chained, with each step receiving the results of the previous.

```javascript
var shortenedMessagesFromBoss = ko.collection(messages, 'id')
	.filter(function (message) {
		return message.from == 'Boss';
	})
	.map(function (message) {
		return message.from + ' demands ' + message.subject;
	});
```

## Automatic Updating

In addition to watching for changes to the original data, knockout.collection watches for changes in the iterator functions such as the `truthTest` for `filter` and `transform` for map. Any observable items that change inside the iterator function cause the collection to automatically update.

```javascript
var filterBy = ko.observable('Friend');

var filtered = ko.collection(messages, 'id').filter(function (message) {
    return message.from = filterBy();
});

// Changing filterBy causes filtered to automatically update
filterBy('Boss');
```

## Available Functions

### filter _(alias select)_

`filter({function} truthTest)` 
Filter data, returning all items that pass the given truth test.

```javascript
var filtered = ko.collection(messages).filter(function (message) {
	return message.from == 'Boss';
});
```

### map _(alias collect)_

`map({function} transformation)` 
Map data through given transformation

```javascript
var mapped = ko.collection(messages).map(function (message) {
	return 'Message ' + message.id + ': ' + message.subject;
});
```

### pluck

`pluck({String} parameterName)` 
Pluck specified property value from each item

```javascript
var plucked = ko.collection(messages).pluck('from');
```
### unique _(alias uniq)_

`unique()`
Remove duplicates from collection. _Note, isn't compatible with patch_

```javascript
var unique = ko.collection(messages).unique();
```

## About

- Author: Tim Hall
- License: MIT
- Dependencies: knockout, underscore
