require.config({
    paths: {
        sockjs: 'http://cdn.sockjs.org/sockjs-0.3.2.min',
        jquery: 'http://code.jquery.com/jquery-1.11.0.min',
    },

    shim: {
        jquery: {
            exports: 'jquery',
        },
    },
});

require([
    'vessel',
], function(Vessel) {
    'use strict';
    var vessel = new Vessel('http://localhost:8081/vessel', {debug: true, transport: 'http'});
    var input = document.getElementById("input");
    var send = document.getElementById("submit");
    send.onclick = function() {
        if (input.value == 'test') {
            vessel.send('foo', input.value, function(message) {
                console.log(message);
            });
        } else {
            vessel.send('foo', input.value);
        }
    };

    vessel.subscribe("baz", function(message) {
        console.log(message);
    });
});
