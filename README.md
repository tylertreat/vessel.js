vessel.js
=========

[Vessel](https://github.com/tylertreat/vessel) is a fast, asynchronous client-server messaging library. Send, receive, and subscribe to messages over channels.

```javascript
var vessel = new Vessel('http://localhost:8081/vessel');

vessel.onMessage(function(channel, message) {
    // Fire whenever a message is received.
    console.log(channel + ': ' + message);
});

vessel.subscribe('notifications', function(message) {
    // Fire whenever a message is received on the 'notifications' channel.
    console.log(message);
});

// Send a message on the 'foo' channel.
vessel.send('foo', 'hello world!');

// Send another message on the 'foo' channel but listen for a response.
vessel.send('foo', 'is this thing on?', function(message) {
    // Fire when a response to this message is received.
    console.log(message);
});
```
