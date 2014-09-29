define([
    'jquery',
], function($) {
    'use strict';

    // Create a new HTTPTransport for sending and receiving messages via HTTP.
    // Message receiving works via polling with a configurable interval.
    function HTTPTransport(host, options) {
        if (!(this instanceof HTTPTransport)) {
            // Make `new` optional.
            return new HTTPTransport(host, options);
        }

        options = options || {};
        this._options = options;
        this._debug = 'debug' in options ? options.debug : false;
        this._host = host;
        this._polls = {};
        this._pollInterval = options.pollInterval || 3000;
        this._subscriptions = {};
    }

    // Log the message if debug is enabled.
    HTTPTransport.prototype._log = function(msg) {
        if (this._debug) {
            console.log(msg);
        }
    };

    // Send a message. If the message is successfully sent, begin polling for
    // responses. If an onMessage callback is set, it will be fired for each
    // response.
    HTTPTransport.prototype.send = function(payload) {
        $.ajax({
            url: this._host,
            type: 'POST',
            contentType: 'json',
            data: payload,
            dataType: 'json',
            success: function(response) {
                // Begin polling for responses.
                var intervalID = setInterval(function() {
                    this._poll(response.id, response.channel, response.responses);
                }.bind(this), this._pollInterval);

                // Register a polling context to track the number of responses
                // received and the interval ID.
                this._polls[response.id] = {intervalID: intervalID, received: 0};
            }.bind(this),
        });

    };

    // Poll for message responses. Fire the onMessage callback for each
    // response. If responses are done, stop polling.
    HTTPTransport.prototype._poll = function(id, channel, url) {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                var responseCtx = this._polls[id];
                if (response.done) {
                    // Stop polling if we're done.
                    clearInterval(responseCtx.intervalID);
                    delete this._polls[id];
                }

                // Fire onMessage for each response.
                if (this.onMessage) {
                    for (var i = responseCtx.received; i < response.responses.length; i++) {
                        this.onMessage(JSON.stringify(response.responses[i]));
                    }
                }

                // Update our place in the responses.
                responseCtx.received = response.responses.length;
            }.bind(this),
            error: function(xhr, error) {
                if (xhr.status === 404) {
                    // Stop polling if there's nothing to poll for.
                    this._log('Message ' + id + ' not registered');
                    clearInterval(this._polls[id].intervalID);
                    delete this._polls[id];
                } else {
                    // TODO: Make this more intelligent. If a poll sequentially fails n
                    // times in a row, kill it.
                    this._log(error);
                }
            }.bind(this),
        });
    };

    // Poll for channel messages. Track the timestamp for the last message seen
    // on the channel and only ask for messages since then.
    HTTPTransport.prototype.subscribe = function(channel) {
        var intervalID = setInterval(function() {
            var lastSeen = this._subscriptions[channel].lastSeen;
            $.ajax({
                url: this._host + '/channel/' + channel + '?since=' + lastSeen,
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    if (this.onMessage) {
                        for (var i = 0; i < response.length; i++) {
                            this.onMessage(JSON.stringify(response[i]));
                            if (i === response.length - 1) {
                                // Update the last seen timestamp.
                                this._subscriptions[channel].lastSeen = response[i].timestamp;
                            }
                        }
                    }
                }.bind(this),
                error: function(xhr, error) {
                    this._log(error);
                }.bind(this),
            });
        }.bind(this), this._pollInterval);
        this._subscriptions[channel] = {intervalID: intervalID, lastSeen: 0};
    };

    HTTPTransport.prototype.unsubscribe = function(channel) {
        if (channel in this._subscriptions) {
            clearInterval(this._subscriptions[channel]);
            delete this._subscriptions[channel];
        }
    };

    return HTTPTransport;
});
