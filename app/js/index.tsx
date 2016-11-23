/// <reference path="../../typings/index.d.ts" />
/// <reference path="./defs.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as components from './components';
import * as Leap from 'leapjs';
import * as constants from './constants';
import * as util from './util'

window['constants'] = constants;

const t9: T9Defs = require('./libs/t9.js');

const hashSplit = window.location.hash.slice(1).split('-').map((option) => {
	return option.toLowerCase();
});
const DEBUG = hashSplit.indexOf('d') > -1;
const USET9 = hashSplit.indexOf('not9') === -1;
const LANG = hashSplit.indexOf('nl') > -1 ? 'dutch' : 'english';
const SHOWDOT = hashSplit.indexOf('dot') > -1;
if (!SHOWDOT) {
	document.getElementById('pointerDot').style.display = 'none';
}
if (DEBUG) {
	console.log(`Using debug mode`);
}

const symbolRadius = Math.min(window.innerWidth, window.innerHeight * 0.98) *
	0.45;

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
		return Math.abs(listenerAngle - listenerAngle) <= constants.get('GLOW_ANGLE');
	}

function radiusFromCenter(pos: PointerPosition): number {
	const center = {
		x: constants.get('HALF_WINDOW_WIDTH'),
		y: constants.get('HALF_WINDOW_HEIGHT')
	};

	return Math.sqrt(
		Math.pow(center.x - pos.x, 2) + Math.pow(center.y - pos.y, 2)
	);
}

function getGlowIntensity(symbolRadius: number, radius: number): number {
	return Math.pow((Math.min(radius / symbolRadius, 1) * 100), 2) / 100;
}

function getAngleDifference(angle1: number, angle2: number): number {
	if (angle1 >= 360 - constants.get('GLOW_ANGLE') &&
		angle2 <= constants.get('GLOW_ANGLE')) {
			angle2 += 360;
	} else if (angle2 >= 360 - constants.get('GLOW_ANGLE') &&
		angle1 <= constants.get('GLOW_ANGLE')) {
			angle1 += 360;
		}
	return Math.abs(angle1 - angle2);
}

function getAngleGlowIntensity(max: number, difference: number): number {
	return (((constants.get('GLOW_ANGLE') - 
		difference * constants.get('GLOW_ANGLE_FACTOR')) * max)
		/ constants.get('GLOW_ANGLE')) || 0;
}

function keyPressed(glowIntensity: number, angleDifference: number): boolean {
	return cursorReset && glowIntensity >= constants.get('KEY_PRESSED_MIN_DISTANCE') &&
		angleDifference <= constants.get('KEY_PRESSED_MAX_ANGLE_DIFF');
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
		let gestureAngle = Math.atan2(pos.y - constants.get('HALF_WINDOW_HEIGHT'),
			pos.x - constants.get('HALF_WINDOW_WIDTH')) * 180 / Math.PI;
		if (gestureAngle < 0) {
			gestureAngle += 360;;
		}
		gestureAngle = (gestureAngle + 90) % 360;

		const radius = radiusFromCenter(pos);

		if (radius >= symbolRadius) {
			const maxGlowIntensity = getGlowIntensity(symbolRadius, radius);

			if (USET9) {
				gestureAngle = (gestureAngle + (360 / 26)) % 360;
				if (maxGlowIntensity >= constants.get('KEY_PRESSED_MIN_DISTANCE') * 0.8 && cursorReset) {
					//Some area was toggled, find out which one
					let toggledIndex: number = comm._symbolListeners.length - 1;
					let lastSlice: number = 0;
					let broke: boolean = false;
					for (let i = 0; i < comm._symbolListeners.length; i++) {
						if (comm._symbolListeners[i].element.elName === 'T9Slice') {
							if (gestureAngle < comm._symbolListeners[i].angle) {
								toggledIndex = lastSlice;
								broke = true;
								break;
							}
							lastSlice = i;
						}
					}
					if (!broke) {
						toggledIndex = lastSlice;
					}

					comm._symbolListeners[toggledIndex].listener(SymbolCommType.fired, radius - symbolRadius);
					cursorReset = false;

					comm.fireMainFaceListener(MainFaceCommType.T9KeyPressed,+ 
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

const pointerDot = document.getElementById('pointerDot');
function updatePointerPos() {
	if (lastPointerPos.x !== pointer.x || lastPointerPos.y !== pointer.y) {
		if (SHOWDOT) {
			pointerDot.style.top = `${pointer.y - 7.5}px`;
			pointerDot.style.left = `${pointer.x - 7.5}px`;
		}

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

const websocket = new WebSocket('ws://localhost:1234', 'echo-protocol');
const pointerIcon = document.getElementById('pointerSpotted');
function getPointerRadius(vector: VectorArr, directionAngle: number): number {
	//Max from the center is bending your finger about 30 degrees,
	const currentRatio = Math.abs(vector[2]) /
		(Math.abs(vector[0]) + Math.abs(vector[1]));

	return Math.min((1 / currentRatio) * constants.get('FINGER_ADJUSTMENT'), 1);
}

function getPointer2DDirection(vector: VectorArr): number {
	let angle = Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
	return angle;
}

function handleGestures(data: WSData): boolean {
	if (data.gesture === Gesture.none) {
		return false;
	}

	comm.fireMainFaceListener(MainFaceCommType.gesture, data.gesture);
}

websocket.onmessage = (event) => {
	const stringifiedData: string = event.data;
	const data = JSON.parse(stringifiedData) as WSData;

	const spottedGesture = handleGestures(data);

	if (data.foundPointer) {
		//Get the amount of degrees that the finger is moving to the outside
		const pointer2DDirection = -getPointer2DDirection(data.direction) * (Math.PI / 180);
		const radiusPercentage = getPointerRadius(data.direction, pointer2DDirection);
		
		const radiusPx = radiusPercentage * symbolRadius;
		pointer.x = constants.get('HALF_WINDOW_WIDTH') +
			(Math.cos(pointer2DDirection) * radiusPx);
		pointer.y = constants.get('HALF_WINDOW_HEIGHT') + 
			(Math.sin(pointer2DDirection) * radiusPx);

		pointerIcon.classList.remove('noPointer');
	} else if (!spottedGesture) {
		pointerIcon.classList.add('noPointer');
	}
}

function finishLoading() {
	document.getElementById('spinnerOverlay').style.opacity = '0';
	window.setTimeout(() => {
		document.getElementById('spinnerOverlay').style.display = 'none';
		isLoading = false;
		window.requestAnimationFrame(updatePointerPos);
	}, 500);
}

util.fetch(`/resources/${LANG}.txt`).then((res) => {
	return res.text();
}).then((text) => {
	t9.init(text);
	finishLoading();
});