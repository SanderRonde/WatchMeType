/// <reference path="../typings/tsd.d.ts" />

import * as http from 'http';
import * as path from 'path';
import * as express from 'express';

const Router = require('router');
const finalHandler = require('finalhandler');

const PORT = 1234;

const router = new Router();
router.use(express.static(path.join(__dirname, '../app'), {
	maxAge: 60 * 60 * 24
}));

function reqHandler(req: http.IncomingMessage, res: http.ServerResponse) {
	router(req, res, finalHandler(req, res));
}

http.createServer(reqHandler).listen(PORT, () => {
	console.log(`HTTP server listening on port ${PORT}`);
});