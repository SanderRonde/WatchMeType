/// <reference path="../../typings/index.d.ts" />
/// <reference path="./defs.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as components from './components';
const t9: T9Defs = require('./t9.js');

const hashSplit = window.location.hash.slice(1).split('-');
const DEBUG = hashSplit.indexOf('d') > -1;
const USET9 = hashSplit.indexOf('t9') > -1;
const LANG = hashSplit.indexOf('nl') > -1 ? 'dutch' : 'english';
if (DEBUG) {
	console.log(`Using debug mode`);
}

console.log(DEBUG, USET9);
const GLOW_ANGLE = 22.5;
const GLOW_START_RADIUS_PERCENTAGE = 50;
const GLOW_ANGLE_FACTOR = 1.1;
const KEY_PRESSED_MIN_DISTANCE = 90;
const KEY_PRESSED_MAX_ANGLE_DIFF = 10;

let isLoading = true;
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

		if (radius >= symbolRadius * (GLOW_START_RADIUS_PERCENTAGE / 100)) {
			const maxGlowIntensity = getGlowIntensity(symbolRadius, radius);

			if (USET9) {
				gestureAngle += (360 / 26);
				if (maxGlowIntensity >= KEY_PRESSED_MIN_DISTANCE * 0.8 && cursorReset) {
					//Some area was toggled, find out which one
					let toggledIndex = comm._symbolListeners.length - 1;
					let lastSlice = 0;
					for (let i = 0; i < comm._symbolListeners.length; i++) {
						if (comm._symbolListeners[i].element.elName === 'T9Slice') {
							if (gestureAngle < comm._symbolListeners[i].angle) {
								toggledIndex = lastSlice;
								break;
							}
							lastSlice = i;
						}
					}

					comm._symbolListeners[toggledIndex].listener(SymbolCommType.fired);
					cursorReset = false;

					comm.fireMainFaceListener(MainFaceCommType.T9KeyPressed, 
						(comm._symbolListeners[toggledIndex].element as T9SliceElement)
							.props.data.index + 1);
				}
			} else {
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
							(listenerData.element as SymbolElement).symbol.value);
					}
				});
			}
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
	comm: comm,
	useT9: USET9,
	t9Lib: t9
}), document.getElementById('mainContainer'));


function updatePointerPos() {
	if (lastPointerPos.x !== pointer.x || lastPointerPos.y !== pointer.y) {
		comm.fireSymbolListeners(pointer);
		lastPointerPos.x = pointer.x;
		lastPointerPos.y = pointer.y;
	}
	window.requestAnimationFrame(updatePointerPos);
}

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

function finishLoading() {
	document.getElementById('spinnerOverlay').style.opacity = '0';
	window.setTimeout(() => {
		document.getElementById('spinnerOverlay').style.display = 'none';
		isLoading = false;
		window.requestAnimationFrame(updatePointerPos);
	}, 500);
}

fetch(`/resources/${LANG}.txt`).then((res) => {
	return res.text();
}).then((text) => {
	t9.init(text);
	finishLoading();
});