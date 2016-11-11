/// <reference path="../typings/index.d.ts" />
/// <reference path="libs/leapmotion.d.ts" />

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as express from 'express';
import * as websocket from 'websocket';
import * as leap from 'leapjs';
const WebSocketServer = websocket.server;
require('./libs/screenposition.js');
const Router = require('router');
const finalHandler = require('finalhandler');

const PORT = 1234;

new Promise((resolve) => {
	const router = new Router();
	console.log(path.join(__dirname, '../app'));
	router.use('/', express.static(path.join(__dirname, '../app'), {
		maxAge: 60 * 60 * 24
	}));
	router.get('/', express)

	function reqHandler(req: http.IncomingMessage, res: http.ServerResponse) {
		router(req, res, finalHandler(req, res));
	}

	const server = http.createServer(reqHandler);
	server.listen(PORT, () => {
		console.log(`HTTP server listening on port ${PORT}`);
	});

	resolve(server);
}).then((server: http.Server) => {
	return new Promise((resolve) => {
		const activeConnections: Array<websocket.connection> = [];
		const wsServer = new WebSocketServer({
			httpServer: server,
			autoAcceptConnections: true 
		});

		wsServer.on('request', (request) => {
			const connection = request.accept(null, request.origin);
			activeConnections.push(connection);

			connection.on('close', () => {
				activeConnections.slice(activeConnections.indexOf(connection, 1));
			});
		});
		resolve(activeConnections);
	});
}).then((activeConnections) => {
	leap.loop({
		background: true,
		optimizeHMD: false,
		useAllPlugins: true
	}, (frame) => {
		console.log(frame);
	});
});