define([
    'sockjs',
    'json_marshaler',
], function(SockJS, JSONMarshaler) {
    'use strict';

    function SockJSTransport(host, options) {
        if (!(this instanceof SockJSTransport)) {
            // Make `new` optional.
            return new SockJSTransport(host, options);
        }

        var self = this;

        options = options || {};
        this._options = options;
        this._debug = 'debug' in options ? options.debug : false;
        this._marshaler = 'marshaler' in options ?
            options.marshaler :
            new JSONMarshaler();
        this._sockjs = new SockJS(host);

        // Fire the onMessage callback for each received message.
        this._sockjs.onmessage = function(e) {
            if (this.onMessage) {
                this.onMessage(e.data);
            }
        }.bind(this);
    }

    SockJSTransport.prototype.send = function(payload) {
        this._sockjs.send(payload);
    };

    // Noop. Subscription messages will be handled by sockjs.onmessage.
    SockJSTransport.prototype.subscribe = function(channel) {};

    // Noop.
    SockJSTransport.prototype.unsubscribe = function(channel) {};

    return SockJSTransport;
});
