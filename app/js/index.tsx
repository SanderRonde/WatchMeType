/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./defs.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as components from './components';

const DEBUG = window.location.hash === '#d';
const GLOW_ANGLE = 22.5;
const GLOW_START_RADIUS_PERCENTAGE = 50;
const GLOW_ANGLE_FACTOR = 1.1;
const KEY_PRESSED_MIN_DISTANCE = 90;
const KEY_PRESSED_MAX_ANGLE_DIFF = 10;

let cursorReset = true;

const pointer: PointerPosition = {
	x: window.innerWidth / 2,
	y: window.innerHeight / 2
};
const lastPointerPos: PointerPosition = {
	x: window.innerWidth / 2,
	y: window.innerHeight / 2
};

function shouldFireListener(gestureAngle: number, 
	listenerAngle: number): boolean {
		return Math.abs(listenerAngle - listenerAngle) <= GLOW_ANGLE;
	}

function radiusFromCenter(pos: PointerPosition): number {
	const center = {
		x: window.innerWidth / 2,
		y: window.innerHeight / 2
	};

	return Math.sqrt(
		Math.pow(center.x - pos.x, 2) + Math.pow(center.y - pos.y, 2)
	);
}

function getGlowIntensity(symbolRadius: number, radius: number): number {
	return Math.pow((Math.min(radius / symbolRadius, 1) * 100), 2) / 100;
}

function getAngleDifference(angle1: number, angle2: number): number {
	if (angle1 >= 360 - GLOW_ANGLE && angle2 <= GLOW_ANGLE) {
		angle2 += 360;
	} else if (angle2 >= 360 - GLOW_ANGLE && angle1 <= GLOW_ANGLE) {
		angle1 += 360;
	}
	return Math.abs(angle1 - angle2);
}

function getAngleGlowIntensity(max: number, difference: number): number {
	return (((GLOW_ANGLE - difference * GLOW_ANGLE_FACTOR) * max) / GLOW_ANGLE) || 0;
}

function keyPressed(glowIntensity: number, angleDifference: number): boolean {
	return cursorReset && glowIntensity >= KEY_PRESSED_MIN_DISTANCE &&
		angleDifference <= KEY_PRESSED_MAX_ANGLE_DIFF;
}

const comm: CommHandlers = {
	_symbolListeners: [],
	addSymbolListener(angle, symbol, listener) {
		comm._symbolListeners.push({
			angle: angle,
			element: symbol,
			listener: listener
		});
	},
	fireSymbolListeners(pos) {
		let gestureAngle = Math.atan2(pos.y - window.innerHeight / 2,
			pos.x - window.innerWidth / 2) * 180 / Math.PI;
		if (gestureAngle < 0) {
			gestureAngle = 360 + gestureAngle;
		}
		gestureAngle += 90;
		gestureAngle = gestureAngle % 360;

		const symbolRadius = Math.min(window.innerWidth, window.innerHeight * 0.98) *
			0.45;
		const radius = radiusFromCenter(pos);

		if (radius >= symbolRadius * (GLOW_START_RADIUS_PERCENTAGE / 100) {
			const maxGlowIntensity = getGlowIntensity(symbolRadius, radius);

			comm._symbolListeners.filter((listenerData) => {
				if (shouldFireListener(gestureAngle, listenerData.angle)) {
					return true;
				}
				listenerData.listener(SymbolCommType.intensityUpdate, 0);
			}).forEach((listenerData) => {
				const angleDifference = getAngleDifference(gestureAngle,
					listenerData.angle);
				listenerData.listener(SymbolCommType.intensityUpdate,
					getAngleGlowIntensity(maxGlowIntensity, 
						angleDifference) / 100);

				if (keyPressed(maxGlowIntensity, angleDifference)) {
					cursorReset = false;

					listenerData.listener(SymbolCommType.fired);
					comm.fireMainFaceListener(MainFaceCommType.keyPressed, 
						listenerData.element.symbol);
				}
			});
		} else {
			cursorReset = true;

			comm._symbolListeners.forEach((listenerData) => {
				listenerData.listener(SymbolCommType.intensityUpdate, 0);
			});
		}
	},

	_faceListeners: [],
	addMainFaceListener(listener) {
		comm._faceListeners.push(listener);
	},
	fireMainFaceListener(type: MainFaceCommType, data: Gesture|string) {
		comm._faceListeners.forEach((listener) => {
			listener(type, data);
		});
	},

	sendMessageToController(type: ControllerCommType, data: string) {
		switch (type) {
			case ControllerCommType.send:
				alert(`Sent message "${data}"`);
				break;
		}
	}
};
ReactDOM.render(React.createElement(components.MainFace, {
	comm: comm
}), document.getElementById('mainContainer'));


function updatePointerPos() {
	if (lastPointerPos.x !== pointer.x || lastPointerPos.y !== pointer.y) {
		comm.fireSymbolListeners(pointer);
		lastPointerPos.x = pointer.x;
		lastPointerPos.y = pointer.y;
	}
	window.requestAnimationFrame(updatePointerPos);
}
window.requestAnimationFrame(updatePointerPos);

if (DEBUG) {
	window.onmousemove = (e) => {
		pointer.x = e.clientX;
		pointer.y = e.clientY;
	}
}

const websocket = new WebSocket('ws://localhost:1234');
websocket.onmessage = (event) => {
	const data: WSData = event.data;

	pointer.x = data.x;
	pointer.y = data.y;
}