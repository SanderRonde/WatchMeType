///<reference path="../../typings/tsd.d.ts"/>

interface SymbolElement {
	symbol: string;
	glow: HTMLElement;
	opacity: number;
	symbolCont: HTMLElement;
	firedTimeout: number;
	props: {
		comm: CommHandlers,
		data: {
			angle: number;
			index: number;
		}
	}

	constructor: Function;
	render(): JSX.Element;
}

declare const enum SymbolCommType {
	intensityUpdate = 0,
	fired = 1,
	updateCase = 2
}

declare const enum Gesture {
	clear = 0,
	space = 1
}

declare const enum MainFaceCommType {
	keyPressed = 0,
	gesture = 1
} 

declare const enum ControllerCommType {
	send = 0
}

interface PointerPosition {
	x: number;
	y: number;
}

type PosListener = (type: SymbolCommType, data?: number|boolean) => void;

interface PosListenerData {
	angle: number;
	element: SymbolElement;
	listener: PosListener;
}

type MainFaceListener = (type: MainFaceCommType, data: string|Gesture) => void; 

interface CommHandlers {
	_symbolListeners: Array<PosListenerData>;
	addSymbolListener(angle: number, symbol: SymbolElement,
		listener: PosListener): void;
	fireSymbolListeners(pos: PointerPosition): void;

	_faceListeners: Array<MainFaceListener>;
	addMainFaceListener(listener: MainFaceListener): void;
	fireMainFaceListener(type: MainFaceCommType, data: Gesture|string): void;

	sendMessageToController(type: ControllerCommType, data: string): void;
}

interface WSData {
	x: number;
	y: number;
}