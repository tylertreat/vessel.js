define([
], function() {
    'use strict';

    function JSONMarshaler() {
        if (!(this instanceof JSONMarshaler)) {
            // Make `new` optional.
            return new JSONMarshaler();
        }
    }

    JSONMarshaler.prototype.marshal = function(msg) {
        return JSON.stringify(msg);
    };

    JSONMarshaler.prototype.unmarshal = function(msg) {
        return JSON.parse(msg);
    };

    return JSONMarshaler;
});
