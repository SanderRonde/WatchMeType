/// <reference path="../typings/index.d.ts" />
/// <reference path="libs/leapmotion.d.ts" />

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as express from 'express';
import * as websocket from 'websocket';
import * as Leap from 'leapjs';
import recognizeGesture from './gestureRecognition';
const WebSocketServer = websocket.server;
const Router = require('router');
const finalHandler = require('finalhandler');

const PORT = 1234;

function getFinger(frame: Leap.Frame, order: Array<Leap.FingerName>
	): Leap.Pointable {
		const pointables = frame.pointables;
		let index = 0;
		let lastPointable = null;
		while (index < order.length && !lastPointable) { 
			lastPointable = pointables.filter((pointable) => {
				return frame.finger(pointable.id).type === order[index];
			})[0];
			index++;
		}
		return lastPointable;
	}

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
		const wsServer = new WebSocketServer({
			httpServer: server,
			autoAcceptConnections: true 
		});

		wsServer.on('request', (request) => {
			const connection = request.accept('something', request.origin);
		});
		resolve(wsServer);
	});
}).then((wsServer: websocket.server) => {
	let lastPointable: string = null;

	const controller = Leap.loop({
		background: true,
		optimizeHMD: false
	}, (frame) => {
		if (wsServer.connections.length === 0) {
			return;
		}

		const message: WSData = {} as any;
		message.gesture = recognizeGesture(frame);

		if (frame.pointables.length === 0) {
			lastPointable = null;
			message.foundPointer = false;
		} else {
			message.foundPointer = true;
			let pointable: Leap.Pointable;
			if (lastPointable && frame.pointable(lastPointable) &&
				frame.pointable(lastPointable).valid) {
				//Follow the same finger as before
				pointable = frame.pointable(lastPointable);
			} else {
				pointable = getFinger(frame, [
					Leap.FingerName.index,
					Leap.FingerName.middle,
					Leap.FingerName.ring,
					Leap.FingerName.pinky,
					Leap.FingerName.thumb
				]);
				lastPointable = pointable.id;
			}
			if (!pointable.valid) {
				message.foundPointer = false;
				wsServer.broadcastUTF(JSON.stringify(message));
				return;
			}

			(message as LeapPointerData).direction = pointable.direction; 
			(message as LeapPointerData).stabilizedTipPosition = pointable.stablizedTipPosition;
		}
		wsServer.broadcastUTF(JSON.stringify(message));
	});
});