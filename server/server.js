"use strict";
var http = require('http');
var path = require('path');
var express = require('express');
var websocket = require('websocket');
var gestureRecognition_1 = require('./gestureRecognition');
var WebSocketServer = websocket.server;
var Router = require('router');
var finalHandler = require('finalhandler');
var Leap = require('./libs/leapjs');
var PORT = 1234;
function getFinger(frame, order) {
    var pointables = frame.pointables;
    var index = 0;
    var lastPointable = null;
    while (index < order.length && !lastPointable) {
        lastPointable = pointables.filter(function (pointable) {
            var finger = frame.finger(pointable.id);
            return finger.type === order[index] && finger.extended;
        })[0];
        index++;
    }
    return lastPointable;
}
new Promise(function (resolve) {
    var router = new Router();
    console.log(path.join(__dirname, '../app'));
    router.use('/', express.static(path.join(__dirname, '../app'), {
        maxAge: 60 * 60 * 24
    }));
    router.get('/', express);
    function reqHandler(req, res) {
        router(req, res, finalHandler(req, res));
    }
    var server = http.createServer(reqHandler);
    server.listen(PORT, function () {
        console.log("HTTP server listening on port " + PORT);
    });
    resolve(server);
}).then(function (server) {
    return new Promise(function (resolve) {
        var wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: true
        });
        wsServer.on('request', function (request) {
            var connection = request.accept('something', request.origin);
        });
        resolve(wsServer);
    });
}).then(function (wsServer) {
    var lastPointable = null;
    var hasNoEvents = true;
    console.log('connecting to controller');
    var controller = Leap.loop({
        background: true,
        optimizeHMD: false
    }, function (frame) {
        if (wsServer.connections.length === 0) {
            return;
        }
        var message = {};
        message.gesture = gestureRecognition_1.default(frame);
        if (frame.pointables.length === 0 ||
            frame.pointables.filter(function (pointable) {
                return frame.finger(pointable.id).extended;
            }).length > 1) {
            lastPointable = null;
            message.foundPointer = false;
        }
        else {
            message.foundPointer = true;
            var pointable = void 0;
            if (lastPointable && frame.pointable(lastPointable) &&
                frame.pointable(lastPointable).valid &&
                frame.finger(lastPointable).extended) {
                pointable = frame.pointable(lastPointable);
            }
            else {
                pointable = getFinger(frame, [
                    1,
                    2,
                    3,
                    4,
                    0
                ]);
                if (pointable) {
                    lastPointable = pointable.id;
                }
            }
            if (!pointable || !pointable.valid) {
                message.foundPointer = false;
                wsServer.broadcastUTF(JSON.stringify(message));
                return;
            }
            message.direction = pointable.direction;
            message.stabilizedTipPosition = pointable.stablizedTipPosition;
        }
        if (!message.foundPointer && message.gesture === 0) {
            if (!hasNoEvents) {
                wsServer.broadcastUTF(JSON.stringify(message));
                hasNoEvents = true;
            }
        }
        else {
            wsServer.broadcastUTF(JSON.stringify(message));
            hasNoEvents = false;
        }
    });
});
//# sourceMappingURL=server.js.map