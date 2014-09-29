define([
    'sockjs',
    'json_marshaler',
    'http_transport',
    'sockjs_transport',
], function(SockJS, JSONMarshaler, HTTPTransport, SockJSTransport) {
    'use strict';

    // Create a new Vessel client for sending and receiving messages.
    function Vessel(host, options) {
        if (!(this instanceof Vessel)) {
            // Make `new` optional.
            return new Vessel(host, options);
        }

        var self = this;

        options = options || {};
        this._options = options;
        this._debug = 'debug' in options ? options.debug : false;

        this._host = host;
        this._msgCallbacks = {};
        this._chanCallbacks = {};
        this._marshaler = 'marshaler' in options ?
            options.marshaler :
            new JSONMarshaler();

        // Default to sockjs transport.
        var transport = 'transport' in options ? options.transport : 'sockjs';
        if (transport === 'sockjs') {
            this._transport = new SockJSTransport(host, options);
        } else if (transport === 'http') {
            this._transport = new HTTPTransport(host, options);
        } else {
            throw "Invalid transport " + transport;
        }

        // On message, fire receive callback, message callback, then channel
        // callback.
        this._transport.onMessage = function(msg) {
            self._log('Recv: ' + msg);
            var payload = self._marshaler.unmarshal(msg);

            if (self._recvCallback) {
                self._recvCallback(payload.channel, payload.body);
            }

            if (payload.id in self._msgCallbacks) {
                self._msgCallbacks[payload.id](payload.body);
                delete self._msgCallbacks[payload.id];
            }

            if (payload.channel in self._chanCallbacks) {
                self._chanCallbacks[payload.channel](payload.body);
            }
        };
    }

    // Log the message if debug is enabled.
    Vessel.prototype._log = function(msg) {
        if (this._debug) {
            console.log(msg);
        }
    };

    // Return the next unique message identifier.
    Vessel.prototype._nextId = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
    };

    Vessel.prototype._now = function() {
        if (!Date.now) {
            Date.now = function() { return new Date().getTime(); };
        }

        return Math.round(Date.now() / 1000);
    };

    // Send a message on the given channel. If a callback is provided, it will
    // be invoked when a response is received. If the channel has a callback
    // registered, both callbacks will be invoked. Message callbacks are only
    // invoked the first time a message response is received.
    Vessel.prototype.send = function(channel, msg, callback) {
        var id = this._nextId();
        var payload = this._marshaler.marshal({
            id: id,
            channel: channel,
            body: msg,
            timestamp: this._now(),
        });

        if (callback) {
            this._msgCallbacks[id] = callback;
        }

        this._log('Send: ' + payload);
        this._transport.send(payload);
    };

    // Set a callback to be invoked on every received message. This will be
    // invoked in addition to any channel and message callbacks.
    Vessel.prototype.onMessage = function(callback) {
        this._transport.onMessage(callback);
    };

    // Add a callback to the given channel. This callback will be invoked
    // whenever a message is received on the channel. If a response on the
    // channel is associated with a sent message which has a callback, both
    // callbacks will be invoked.
    Vessel.prototype.subscribe = function(channel, callback) {
        this._chanCallbacks[channel] = callback;
        this._transport.subscribe(channel);
    };

    // Remove a channel callback. Has no effect if the channel has no callback.
    Vessel.prototype.unsubscribe = function(channel) {
        delete this._chanCallbacks[channel];
        this._transport.unsubscribe(channel);
    };

    // Set the marshaler used for serializing/deserializing messages.
    Vessel.prototype.setMarshaler = function(marshaler) {
        this._marshaler = marshaler;
    };

    return Vessel;
});
