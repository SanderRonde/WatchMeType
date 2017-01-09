/// <reference path="../../typings/index.d.ts" />
/// <reference path="./defs.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as components from './components';
import * as util from './util'

const KEY_PRESSED_MIN_DISTANCE = 90;
const KEY_PRESSED_MAX_ANGLE_DIFF = 10;
const FINGER_ADJUSTMENT = 1.3;
const VMIN = Math.min(window.innerWidth, window.innerHeight) / 100;
const HALF_WINDOW_WIDTH = window.innerWidth / 2;
const HALF_WINDOW_HEIGHT = window.innerHeight / 2;
const CHOOSE_SYMBOL_ACTIVATION = 25;
const CANCEL_SPECIFIC_SYMBOL_MODE_ANGLE = 40;

const t9: T9Defs = require('./libs/t9.js');

const hashSplit = window.location.hash.slice(1).split('-').map((option) => {
	return option.toLowerCase();
});
const DEBUG = hashSplit.indexOf('d') > -1;
const LANG = (hashSplit.indexOf('nl') > -1 ||
	hashSplit.indexOf('dutch') > -1) ? 'dutch' : 'english';
const SHOWDOT = hashSplit.indexOf('dot') > -1;
const SHOWTUTORIAL = hashSplit.indexOf('showtutorial') > -1;
if (!SHOWDOT) {
	document.getElementById('pointerDot').style.display = 'none';
}
if (DEBUG) {
	console.log(`Using debug mode`);
}

const SYMBOL_RADIUS = Math.min(window.innerWidth, window.innerHeight * 0.98) * 0.4;
const MAX_FINGER_RADIUS = Math.min(window.innerWidth, window.innerHeight * 0.98) *
	(0.41 + (CHOOSE_SYMBOL_ACTIVATION / 100));

let pressingKey: number = -1;
let isLoading: boolean = true;
let waitForReset: boolean = false;
let selectingT9LetterAngle: number = -1;
let tutorialVisible: boolean = SHOWTUTORIAL;

if (!SHOWTUTORIAL) {
	document.querySelector('#tutorial').classList.add('hidden');
}

const pointer: PointerPosition = {
	x: window.innerWidth / 2,
	y: window.innerHeight / 2
};
const lastPointerPos: PointerPosition = {
	x: window.innerWidth / 2,
	y: window.innerHeight / 2
};

function radiusFromCenter(pos: PointerPosition): number {
	const center = {
		x: HALF_WINDOW_WIDTH,
		y: HALF_WINDOW_HEIGHT
	};

	return Math.sqrt(
		Math.pow(center.x - pos.x, 2) + Math.pow(center.y - pos.y, 2)
	);
}

function getGlowIntensity(symbolRadius: number, radius: number): number {
	return Math.pow((Math.min(radius / symbolRadius, 1) * 100), 2) / 100;
}

function enterChooseSymbolMode(chars: Array<number|string>, angle: number) {
	selectingT9LetterAngle = angle;
	waitForReset = true;
	chooseSymbolOverlay.addSymbols(chars, angle);
}

function isHoveringOver(area: CircleArea, pos: PointerPosition): boolean {
	if (!area) {
		return false;
	}
	return (Math.pow(pos.x - area.x, 2) + Math.pow(pos.y - area.y, 2) < Math.pow(area.radius, 2));
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
		let gestureAngle = Math.atan2(pos.y - HALF_WINDOW_HEIGHT,
			pos.x - HALF_WINDOW_WIDTH) * 180 / Math.PI;
		if (gestureAngle < 0) {
			gestureAngle += 360;
		}
		gestureAngle = (gestureAngle + 90) % 360;

		const radius = radiusFromCenter(pos);

		if (selectingT9LetterAngle !== -1) {
			//Cancel if needed
			if (!waitForReset && radius >= SYMBOL_RADIUS &&
				Math.abs(gestureAngle - selectingT9LetterAngle) <=
					CANCEL_SPECIFIC_SYMBOL_MODE_ANGLE) {
				//Cancel this mode
				chooseSymbolOverlay.hide();
				selectingT9LetterAngle = -1;
				waitForReset = true;
				return;
			} else {
				//Check if the buttons are being hovered over
				chooseSymbolOverlay.slices.forEach((slice) => {
					if (!slice || !slice.child) {
						return;
					}
					if (isHoveringOver(slice.child.area, pos)) {
						slice.child.symbolCont.classList.add('toggled');
						comm.fireMainFaceListener(MainFaceCommType.specificKeyPressed,
							slice.child.symbol.symbol);
						chooseSymbolOverlay.hide();
						selectingT9LetterAngle = -1;
						waitForReset = true;
					}
				});
			}
		}
		if (waitForReset) {
			if (radius < SYMBOL_RADIUS * 0.5) {
				waitForReset = false;
			} else {
				return;
			}
		}
		if (radius >= SYMBOL_RADIUS) {
			const maxGlowIntensity = getGlowIntensity(SYMBOL_RADIUS, radius);

			gestureAngle = (gestureAngle + (360 / 26)) % 360;
			if (maxGlowIntensity >= KEY_PRESSED_MIN_DISTANCE * 0.8) {
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

				const displacedPixels = radius - SYMBOL_RADIUS;
				if (displacedPixels > CHOOSE_SYMBOL_ACTIVATION * VMIN) {
					//Enter choose-symbol mode
					enterChooseSymbolMode((comm._symbolListeners[toggledIndex].element as T9SliceElement)
						.children.map((slice) => {
							return slice.child.symbol.symbol;
						}), comm._symbolListeners[toggledIndex].angle);
					comm._symbolListeners[toggledIndex].listener(SymbolCommType.fired, 0);
					comm._faceListeners.forEach((faceListener) => {
						faceListener(MainFaceCommType.resetSlices);
					});
					pressingKey = -1;
				} else {
					comm._symbolListeners[toggledIndex].listener(SymbolCommType.fired, 
						displacedPixels);
					pressingKey = (comm._symbolListeners[toggledIndex].element as T9SliceElement)
						.props.data.index + 1;
				}
			}
		} else if (pressingKey !== -1) {
			comm.fireMainFaceListener(MainFaceCommType.T9KeyPressed, pressingKey);
			pressingKey = -1;
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

document.body.addEventListener('keydown', (e) => {
	if (tutorialVisible) {
		goToNextTutorialSlide();
	} else {
		comm.fireMainFaceListener(MainFaceCommType.watchFaceCommand, e.key);
	}
});

const chooseSymbolOverlay: components.ChooseSymbol = 
	ReactDOM.render(React.createElement(components.ChooseSymbol, {
		comm: comm
	}),
	document.getElementById('chooseSymbolOverlay')) as components.ChooseSymbol;

ReactDOM.render(React.createElement(components.MainFace, {
	comm: comm,
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

const websocket = new WebSocket(`ws://${location.host}`, 'echo-protocol');
const pointerIcon = document.getElementById('pointerSpotted');
function getPointerRadius(vector: VectorArr, directionAngle: number): number {
	//Max from the center is bending your finger about 30 degrees,
	const currentRatio = Math.abs(vector[2]) /
		(Math.abs(vector[0]) + Math.abs(vector[1]));

	return Math.min((1 / currentRatio) * FINGER_ADJUSTMENT, 1);
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

Promise.all([
	new Promise((resolve) => {
		websocket.onopen = (event) => {
			resolve();
		};
		websocket.onmessage = (event) => {
			const stringifiedData: string = event.data;
			const data = JSON.parse(stringifiedData) as WSData;

			const spottedGesture = handleGestures(data);
			if (data.foundPointer) {
				//Get the amount of degrees that the finger is moving to the outside
				const pointer2DDirection = -getPointer2DDirection(data.direction) * (Math.PI / 180);
				const radiusPercentage = getPointerRadius(data.direction, pointer2DDirection);
				
				const radiusPx = radiusPercentage * MAX_FINGER_RADIUS;
				pointer.x = HALF_WINDOW_WIDTH +
					(Math.cos(pointer2DDirection) * radiusPx);
				pointer.y = HALF_WINDOW_HEIGHT + 
					(Math.sin(pointer2DDirection) * radiusPx);

				pointerIcon.classList.remove('noPointer');
			} else if (!spottedGesture) {
				pointerIcon.classList.add('noPointer');
			}
		}
	}),
	new Promise((resolve) => {
		util.fetch(`/resources/${LANG}.txt`).then((res) => {
			return res.text();
		}).then((text) => {
			t9.init(text);
			resolve();
		});
	})
]).then(() => {
	//Finish loading
	document.getElementById('spinnerOverlay').style.opacity = '0';
	window.setTimeout(() => {
		document.getElementById('spinnerOverlay').style.display = 'none';
		isLoading = false;
		window.requestAnimationFrame(updatePointerPos);
	}, 500);
});

let currentTutorialSlide: number = 0;
const exitEl = document.querySelector('#closeTutorialButton') as HTMLElement;
const carrouselEl = document.querySelector('#tutorialContents') as HTMLElement;
function goToTutorialSlide(index: number) {
	index = Math.min(index, 5);
	carrouselEl.style.transform = `translateX(calc(-60vmin * ${index}))`;
	dots[currentTutorialSlide].classList.remove('active');
	dots[index].classList.add('active');
	currentTutorialSlide = index;

	exitEl.classList[index === 5 ? 'add' : 'remove']('visible');
}

function goToNextTutorialSlide() {
	goToTutorialSlide(currentTutorialSlide + 1);
}

const dots: [
	HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement
] = Array.prototype.slice.call(document.querySelectorAll('.tutorialButton'))
	.map((dot: HTMLElement) => {
		dot.addEventListener('click', () => {
			goToTutorialSlide(~~dot.getAttribute('data-index'));
		});
		return dot;
	});

exitEl.addEventListener('click', () => {
	document.querySelector('#tutorial').classList.add('hidden');
	tutorialVisible = false;
});