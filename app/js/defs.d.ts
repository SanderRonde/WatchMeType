///<reference path="../../typings/index.d.ts"/>

interface T9Defs {
	dictionary: string;
	dictionaryTree: any;
	words: Array<string>;
	keyMap: {
		[key: number]: string;
	};

	init(dictionary: string): void;
	predict(numericInput: number|string): Array<string>;
	findWords(sequence: number, tree: any, exact: boolean, 
		words: Array<string>, currentWord: string, depth: number): Array<string>;
}

interface SymbolElement {
	symbol: {
		isIcon: boolean;
		symbol: string;
		value: string;
	};
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
	elName: 'Symbol';

	constructor: Function;
	render(): JSX.Element;
}

interface SliceElement {
	child: SymbolElement;

	constructor: Function;
	render(): JSX.Element;
}

interface T9SliceElement {
	props: {
		comm: CommHandlers;
		data: {
			index: number;
			angle: number;
		}
	};
	centerSliceBackground: SVGElement;
	colorTimeout: number;
	children: Array<SliceElement>;
	elName: 'T9Slice';

	constructor: Function;
	render(): JSX.Element;
}

declare const enum SymbolCommType {
	intensityUpdate = 0,
	fired = 1,
	updateTextType = 2
}

declare const enum Gesture {
	clear = 0,
	space = 1
}

declare const enum MainFaceCommType {
	keyPressed = 0,
	gesture = 1,
	T9KeyPressed = 2
} 

declare const enum ControllerCommType {
	send = 0
}

interface PointerPosition {
	x: number;
	y: number;
}

type PosListener = (type: SymbolCommType, data?: number|[boolean, boolean]) => void;

interface PosListenerData {
	angle: number;
	element: SymbolElement|T9SliceElement;
	listener: PosListener;
}

type MainFaceListener = (type: MainFaceCommType, data: string|Gesture) => void; 

interface CommHandlers {
	_symbolListeners: Array<PosListenerData>;
	addSymbolListener(angle: number, element: SymbolElement|T9SliceElement,
		listener: PosListener): void;
	fireSymbolListeners(pos: PointerPosition): void;

	_faceListeners: Array<MainFaceListener>;
	addMainFaceListener(listener: MainFaceListener): void;
	fireMainFaceListener(type: MainFaceCommType,
		data: Gesture|string|number): void;

	sendMessageToController(type: ControllerCommType, data: string): void;
}

interface WSData {
	x: number;
	y: number;
}