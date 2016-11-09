"use strict";
var http = require('http');
var path = require('path');
var express = require('express');
var Router = require('router');
var finalHandler = require('finalhandler');
var PORT = 1234;
var router = new Router();
router.use(express.static(path.join(__dirname, '../app'), {
    maxAge: 60 * 60 * 24
}));
function reqHandler(req, res) {
    router(req, res, finalHandler(req, res));
}
http.createServer(reqHandler).listen(PORT, function () {
    console.log("HTTP server listening on port " + PORT);
});
//# sourceMappingURL=server.js.map