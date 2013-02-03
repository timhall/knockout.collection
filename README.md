knockout.collection
===================

knockout.collection is designed to make it much simpler to interact with observable arrays in knockout. 
Filtering, mapping, and other collection helpers have traditionally required quite a bit of plumbing in knockout.
Take the example of filtering a list of messages by sender:

```
// List of raw messages (e.g. from server)
var messages = ko.observableArray([
  { message: 'Hi there!', from: 'Tim' },
  { message: 'Something important', from: 'Boss' },
  { message: 'Lunch?', from: 'Tim' }
]);

// VM wants to only show messages from Tim, so filter
var messagesfromTim = ko.observableArray(getMessagesFromTim(messages());
var getMessagesFromTim = function (messages) {
  return _.filter(messages, function (message) {
    return message.from == 'Tim';
  });
}

// Subscribe to any changes in messages and update filtered list
messages.subscribe(function (newMessages) {
  messagesfromTim(getMessagesFromTim(newMessages));
});
```

This is a pretty simple example of a common application and it could use some improvement, 
namely with knockout.collection:

```
var messages = ko.observableArray([
  { message: 'Hi there!', from: 'Tim' },
  { message: 'Something important', from: 'Boss' },
  { message: 'Lunch?', from: 'Tim' }
]);

// Create a new collection from the messages data and filter
var messagesFromTim = ko.collection(messages).filter(function (message) {
  return message.from == 'Tim';
});
```

And that's it! The collection automatically updates with messages and applies any filters, mapping, and other helpers.
