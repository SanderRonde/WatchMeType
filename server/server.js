"use strict";
var http = require('http');
var path = require('path');
var express = require('express');
var websocket = require('websocket');
var leap = require('leapjs');
var WebSocketServer = websocket.server;
require('./libs/screenposition.js');
var Router = require('router');
var finalHandler = require('finalhandler');
var PORT = 1234;
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
        var activeConnections = [];
        var wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: true
        });
        wsServer.on('request', function (request) {
            var connection = request.accept(null, request.origin);
            activeConnections.push(connection);
            connection.on('close', function () {
                activeConnections.slice(activeConnections.indexOf(connection, 1));
            });
        });
        resolve(activeConnections);
    });
}).then(function (activeConnections) {
    leap.loop({
        background: true,
        optimizeHMD: false,
        useAllPlugins: true
    }, function (frame) {
        console.log(frame);
    });
});
//# sourceMappingURL=server.js.map