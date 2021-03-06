import * as React from 'react';
import * as util from './util';
/// <reference path="./defs.d.ts" />

type NumString = Array<{
	type: 'T9'|'char'|'T9Caps',
	data: number|string;
	cycles: number;
}>;

const CIRCLE_DEGREES = 360;
const SLICES = 8;
const T9_SLICE_DEGREES = CIRCLE_DEGREES / SLICES;
const PRECISION_SYMBOL_SELECTION_ANGLE = 240;
const T9Keymap = {
	1: 'abc',
	2: 'def',
	3: 'ghi',
	4: 'jkl',
	5: 'mno',
	6: 'pqrs',
	7: 'tuv',
	8: 'wxyz'
};

let isCaps: boolean = false;
let isSymbol: boolean = false;

const T9Arr = util.objToArr(T9Keymap);

/**
 * Divides the circle in "entries" seperate slices
 * 
 * @param {number} maxAngle - The total degrees
 * @param {number} entries - The amount of slices
 * 
 * @return {Object[]} The individual slices
 */
function divideCircle(maxAngle: number, entries: number): Array<{
	index: number;
	angle: number;
}> {
	const res: Array<{
		index: number;
		angle: number;
	}> = [];
	const angle = maxAngle / entries;
	for (let i = 0; i < entries; i++) {
		res[i] = {
			index: i,
			angle: -(maxAngle / 4) + (angle * i)
		};
	}
	return res;
}

const TEXT_CHARS: Array<{
	symbol: string;
	value: string;
}> = ([
	['space_bar', ' '],
	['close', '']
] as Array<[string, string]>).map((symbolPair) => {
	return {
		symbol: symbolPair[0],
		value: symbolPair[1]
	};
});

const SYMBOLS: Array<{
	symbol: string;
	value: string;
}> = ([
	...[
		'!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
		'-', '+', '_', '=', '`', '~', ',', '.', '/', '?',
		'\'', '"', ';', ':', '[', '{', ']', '}', '\\', '|',
		'<', '>'
	].map(sym => [sym])
] as Array<[string, string]|[string]>).map((symbolPair) => {
	if (symbolPair.length === 1) {
		symbolPair[1] = symbolPair[0];
	}
	return {
		symbol: symbolPair[0],
		value: symbolPair[1]
	};
}); 

/**
 * Gets the symbol for slice <at></at> index "index"
 * 
 * @param {number} index - The index of the symbol
 * 
 * @return {Object} The symbol for that position
 */
function getSymbol(index: number): {
	isIcon: boolean;
	symbol: string;
	value: string;
} {
	if (isSymbol) {
		//Switch to the symbols instead of TEXT_CHARS
		if (index <= 9) {
			return {
				isIcon: false,
				symbol: String(index),
				value: String(index)
			};
		} else if (index < 26) {
			const char = SYMBOLS[index - 10 + (isCaps ? 16 : 0)];
			return {
				isIcon: false,
				symbol: char.symbol,
				value: char.value
			};
		} else {
			return {
				isIcon: true,
				symbol: 'space_bar',
				value: ' '
			}
		}
	} else {
		if (index < 26) {
			const charLowerCase = String.fromCharCode(index + 97);
			const char = (isCaps ? charLowerCase.toUpperCase() : charLowerCase);
			return {
				isIcon: false,
				symbol: char,
				value: char
			};
		} else {
			return {
				isIcon: true,
				symbol: TEXT_CHARS[index - 26].symbol,
				value: TEXT_CHARS[index - 26].value
			};
		}
	}
}

const CIRCLE_SLICES = 26;

class Symbol extends React.Component<any, any> implements SymbolElement {
	elName: 'Symbol' = 'Symbol';
	symbol: {
		isIcon: boolean;
		symbol: string;
		value: string;
	};
	area?: CircleArea;
	glow: HTMLElement;
	opacity: number = 0;
	symbolCont: HTMLElement;
	firedTimeout: number = -1;
	props: {
		comm: CommHandlers,
		data: {
			angle: number;
			index: number;
			isLast?: boolean;
			symbol?: string|number;
		};
		isBig?: boolean;
		isExit?: boolean;
	}

	constructor(props: {
		comm: CommHandlers;
		isBig?: boolean;
	}) {
		super(props);

		this.state = this.state || {};
		this.state.isCapitalized = false;
		this.state.isTextSymbol = false;

		props.isBig || props.comm.addSymbolListener(this.props.data.angle + 90, this, (type, data) => {
			switch (type) {
				case SymbolCommType.intensityUpdate:
					if (data < 0 || data !== this.opacity) {
						this.glow.style.opacity = String(data);
						this.opacity = data as number;
					}
					break;
				case SymbolCommType.updateTextType:
					this.setState({
						isCapitalized: data[0] as boolean,
						isTextSymbol: data[1] as boolean
					});
					isCaps = data[0];
					isSymbol = data[1];
					break;
			}
		});
	}
	getClassName(): string {
		return 'symbolCont' + (this.props.isBig ? ' big' : '') +
			(this.props.isExit ? ' exit' : '');
	}
	render() {
		const styles = {
			transform: `rotate(${-this.props.data.angle}deg)`
		};

		let symbolData;
		if (this.props.data.symbol) {
			symbolData = {
				isIcon: false,
				symbol: this.props.data.symbol,
				value: this.props.data.symbol
			};
		} else if (this.props.data.index === 26) {
			symbolData = {
				isIcon: false,
				symbol: '',
				value: ''
			}
		} else {
			symbolData = getSymbol(this.props.data.index);
		}
		this.symbol = symbolData;

		let symbolEl;
		window.setTimeout(() => {
			if (this.props.isBig) {
				const bcr = symbolEl.getBoundingClientRect();
				const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
				this.area = {
					x: bcr.left,
					y: bcr.top + (vmin * 3.5),
					radius: vmin * 10.5
				};
			}
		}, 0);
		return (
			<div className={this.getClassName()} 
					ref={(symbolCont) => this.symbolCont = symbolCont}>
				<div className="symbolGlow" ref={(glow) => this.glow = glow}></div>
				<div ref={(el) => {
					symbolEl = el;
				}} className="symbol" style={styles}>
					{symbolData.isIcon ? 
						<i className="material-icon default-size">{symbolData.symbol}</i> :
						symbolData.symbol}
				</div>
			</div>
		)
	}
}

class Slice extends React.Component<any, any> implements SliceElement {
	child: Symbol;
	sliceEl: HTMLElement;

	constructor(props) {
		super(props);
	}
	getClassName(): string {
		return 'slice' + (this.props.isBig ? ' big' : '') +
			(this.props.isExit ? ' exit' : '');
	}
	render() {
		const styles = {
			transform: `rotate(${this.props.data.angle}deg)`
		};

		return (
			<div ref={(sliceEl) => {this.sliceEl = sliceEl}} className={
				this.getClassName()
			} style={styles}>
				<Symbol ref={SymbolEl => this.child = SymbolEl} isBig={this.props.isBig}
					isExit={this.props.isExit} data={this.props.data} comm={this.props.comm} />
			</div>
		);
	}
}

function polarToCartesian(centerX: number, centerY: number,
	radius: number, angleInDegrees: number): {
		x: number;
		y: number;
	} {
		const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

		return {
			x: centerX + (radius * Math.cos(angleInRadians)),
			y: centerY + (radius * Math.sin(angleInRadians))
		};
	}

function describeArc(x: number, y: number, radius: number,
	startAngle: number, endAngle: number): string {
		const start = polarToCartesian(x, y, radius, endAngle);
		const end = polarToCartesian(x, y, radius, startAngle);

		const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

		return [
			"M", start.x, start.y, 
			"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
		].join(" ");
	}

function getSvgPathForSlice(centerAngle: number, size: number): string {
	const halfSlice = size / 2;
	
	return describeArc(150, 150, 136, centerAngle - halfSlice, centerAngle + halfSlice)
}

interface T9SliceProps {
	comm: CommHandlers;
	data: {
		index: number;
		angle: number;
	}
}

class T9Slice extends React.Component<any, any> implements T9SliceElement {
	elName: 'T9Slice' = 'T9Slice';
	props: T9SliceProps;
	centerSliceBackground: HTMLElement;
	children: Array<Slice> = [];

	constructor(props: T9SliceProps) {
		super(props);

		props.comm.addSymbolListener(this.props.data.angle + 90, this, (type, data) => {
			switch (type) {
				case SymbolCommType.fired:
					const displacedPixels = data as number;
					this.children.forEach((slice) => {
						slice.sliceEl.style.width = `calc(45vmin + ${displacedPixels}px)`;
					});
					this.centerSliceBackground.style['will-change'] =
						'width, height, margin-left, margin-top';
					this.centerSliceBackground.style.width = `calc(98vmin + ${displacedPixels * 2}px)`;
					this.centerSliceBackground.style.height = `calc(98vmin + ${displacedPixels * 2}px)`;
					this.centerSliceBackground.style.marginLeft = `${-displacedPixels}px`;
					this.centerSliceBackground.style.marginTop = `${-displacedPixels}px`;
					this.centerSliceBackground.children[0].classList.add('toggled');
					break;
			}
		})
	}
	render() {
		const symbols = T9Keymap[this.props.data.index + 1].length;
		const prevLetters = T9Arr.slice(0, this.props.data.index).join('').length;
		const sliceData = divideCircle(CIRCLE_DEGREES / SLICES, symbols).map((slice) => {
			slice.angle += this.props.data.angle;
			if (symbols > 3) {
				slice.angle -= 2.5;
			}
			slice.index += prevLetters;
			return slice;
		});

		const centerSliceSize = T9_SLICE_DEGREES - 1;
		const startAngle = 3.75 + (this.props.data.index * 45);
		
		return (
			<div className="T9SliceCont">
				<div className="T9SliceBackground">
					<svg viewBox="0 0 300 300">
						<path className="T9SliceBorder" 
							d={getSvgPathForSlice(startAngle - (centerSliceSize / 2),
								1)}></path>
						<path className="T9SliceBorder" 
							d={getSvgPathForSlice(startAngle + (centerSliceSize / 2),
								1)}></path>
					</svg>
					<svg viewBox="0 0 300 300" 
						ref={centerSliceBackground => this.centerSliceBackground = 
								centerSliceBackground as any}>
						<path className="T9SliceCenter" 
							d={getSvgPathForSlice(startAngle, centerSliceSize)}>
						</path>
					</svg>
				</div>
				{sliceData.map((slice) => {
					return <Slice ref={(sliceEl) => {this.children.push(sliceEl)}}
						key={slice.index} data={slice} comm={this.props.comm} />;
				})}
			</div>
		);
	}
}

function splitNumString(numstring: NumString): Array<{
	type: 'T9'|'char'|'T9Caps';
	arr: Array<string|number>;
	cycles: number;
}> {
	if (numstring.length === 0) {
		return [];
	}

	let prevType: 'T9'|'char'|'T9Caps' = numstring[0].type;
	const arr: Array<{
		type: 'T9'|'char'|'T9Caps';
		arr: Array<string|number>;
		cycles: number
	}> = [{
		type: prevType,
		arr: [],
		cycles: numstring[0].cycles
	}];

	for (let i = 0; i < numstring.length; i++) {
		if (prevType === numstring[i].type) {
			arr[arr.length - 1].arr.push(numstring[i].data);
		} else {
			prevType = numstring[i].type; 
			arr.push({
				type: numstring[i].type,
				arr: [numstring[i].data],
				cycles: numstring[i].cycles
			});
		}
	}
	return arr;
}

function predictNumString(t9Lib: T9Defs, numstring: {
	type: 'T9'|'char'|'T9Caps';
	arr: Array<string|number>;
	cycles: number;
}): Array<string> {
	const isCaps = numstring.type === 'T9Caps';
	if (numstring.type === 'T9' || isCaps) {
		const predicted = t9Lib.predict(numstring.arr.join(''));
		if (predicted && predicted.length > 0) {
			return isCaps ? predicted.map(str => str.toUpperCase()) : predicted;
		}
		return [numstring.arr.map((num: number) => {
			return isCaps ? T9Arr[num - 1][0].toUpperCase() : T9Arr[num - 1][0];
		}).join('')];
	}
	return [numstring.arr.join('')];
}

class WatchScreen extends React.Component<any, any> {
	state: {
		currentText?: string;
		currentNums?: NumString;
	}
	props: {
		comm: CommHandlers;
		t9Lib: T9Defs;
		parent: MainFace;
	};
	suggestions: Array<string>;
	upperCase: boolean = false;
	symbols: boolean = false;
	mainTextCont: HTMLElement;
	capitalizeButton: HTMLElement;
	symbolButton: HTMLElement;
	backspaceButton: HTMLElement;
	spacebarButton: HTMLElement;
	cycleButton: HTMLElement;

	constructor(props: {
			comm: CommHandlers
		}) {
		super(props);

		props.comm.addMainFaceListener((type, data) => {
			switch (type) {
				case MainFaceCommType.gesture:
					switch (data as Gesture) {
						case Gesture.clear:
							this.deleteChar();
							this._flashElement(this.backspaceButton);
							break;
						case Gesture.space:
							this.addSpace();
							this._flashElement(this.spacebarButton);
							break;
						case Gesture.cycleT9Up:
							this.cycleT9(true);
							this._flashElement(this.cycleButton);
							break;
						case Gesture.cycleT9Down:
							this.cycleT9();
							this._flashElement(this.cycleButton);
							break;
					}
					break;
				case MainFaceCommType.T9KeyPressed:
					this.addNum(data as number, false);
					this._resetSlices();
					break;
				case MainFaceCommType.specificKeyPressed:
					this.addNum(data, true);
					this._resetSlices();
					break;
				case MainFaceCommType.resetSlices:
					this._resetSlices();
					break;
				case MainFaceCommType.watchFaceCommand:
					switch (data as string) {
						case 'Backspace':
							this.deleteChar();
							break;
						case ' ':
							this.addSpace();
							break;
						case 'ArrowUp':
							this.cycleT9(false);
							break;
						case 'ArrowDown':
							this.cycleT9(true);
							break;
						case 'h':
						case 'H':
							this.toggleInterface();
							break;
					}
					break;
			}
		});
	}
	_resetSlices() {
		this.props.parent.slices.forEach((slice) => {
			slice.children.forEach((symbol) => {
				symbol.sliceEl.style.width = '45vmin';
			});
			slice.centerSliceBackground.style['will-change'] = 'auto';
			slice.centerSliceBackground.style.width = `98vmin`;
			slice.centerSliceBackground.style.height = `98vmin`;
			slice.centerSliceBackground.style.marginLeft = '0px';
			slice.centerSliceBackground.style.marginTop = '0px';
			slice.centerSliceBackground.children[0].classList.remove('toggled');
		});
	}
	_flashElement(element: HTMLElement) {
		element.classList.add('active');
		window.setTimeout(() => {
			element.classList.remove('active');
		}, 100);
	}

	toggleInterface() {
		document.body.classList.toggle('hideInterface');
	}
	addNum(num: number|string, isChar: boolean) {
		this.state = this.state || {
			currentNums: [],
			currentText: ''
		};

		const lastChar = this.state.currentNums.slice(-1)[0];
		if (num === ' ' && lastChar && lastChar.type === 'char' && lastChar.data === ' ') {
			//Last character was a space and this one is a space as well,
			//replace last character with a dot
			this.state.currentNums[this.state.currentNums.length - 1].data = '.';
			this.state.currentText = this.state.currentText.slice(0, -1) + '.';
		}

		const wasScrolledToBottom = this.mainTextCont.scrollTop <= 
			this.mainTextCont.scrollHeight;

		const addedObj: {
			type: 'T9'|'char'|'T9Caps';
			data: number|string;
			cycles: number;
		} = {
			cycles: 0
		} as any;
		if (isChar) {
			addedObj.type = 'char';
			addedObj.data = num;
		} else if (isCaps || isSymbol || typeof num === 'string') {
			if (isCaps && !isSymbol) {
				addedObj.type = 'T9Caps';
				addedObj.data = num;	
			} else {
				addedObj.type = 'char';
				addedObj.data = typeof num === 'number' ? getSymbol(num * 3).value : num;
			}
		} else {
			addedObj.type = 'T9';
			addedObj.data = num;
		}

		const newNums = this.state.currentNums.concat(addedObj);
		const oldString = this.state.currentText;
		const oldStringSplit = oldString.split(' ');

		this.suggestions = predictNumString(
			this.props.t9Lib, splitNumString(newNums).pop());
		oldStringSplit[oldStringSplit.length - 1] = this.suggestions[0];

		this.setState({
			currentNums: newNums,
			currentText: splitNumString(newNums).map((numstring) => {
				const predictions = predictNumString(this.props.t9Lib, numstring);
				return predictions[(numstring.cycles + predictions.length)
					% predictions.length];
			}).join('')
		});

		if (wasScrolledToBottom) {
			window.setTimeout(() => {
				this.mainTextCont.scrollTop = this.mainTextCont.scrollHeight;			
			}, 0);
		}
	}
	addSpace() {
		this.addNum(' ', true);
	}
	deleteChar() {
		this.state = this.state || {
			currentText: '',
			currentNums: []
		};
		const textSplit = this.state.currentText.split(' ');
		const newNums = this.state.currentNums.slice(0, -1);
		const isEmpty = newNums.length === 0;

		this.suggestions = isEmpty ? [''] :
			predictNumString(this.props.t9Lib, splitNumString(newNums).pop());

		this.setState({
			currentNums: newNums,
			currentText: isEmpty ? '' : splitNumString(newNums).map((numstring) => {
				const predictions = predictNumString(this.props.t9Lib, numstring);
				return predictions[(numstring.cycles + predictions.length)
					% predictions.length];
			}).join('')
		});
	}
	sendPress() {
		this.props.comm.sendMessageToController(ControllerCommType.send,
			this.state.currentText);
		
		this.setState({
			currentText: '',
			currentNums: []
		});
	}
	toggleCapitalization() {
		this.upperCase = !this.upperCase;
		this.capitalizeButton.classList[this.upperCase ? 'add' : 'remove']('toggled');
		this.props.comm._symbolListeners.forEach((symbolListener) => {
			symbolListener.listener(SymbolCommType.updateTextType, 
				[this.upperCase, this.symbols]);
		});
	}
	toggleSymbols() {
		this.symbols = !this.symbols;
		this.symbolButton.classList[this.symbols ? 'add' : 'remove']('toggled');
		this.props.comm._symbolListeners.forEach((symbolListener) => {
			symbolListener.listener(SymbolCommType.updateTextType, 
				[this.upperCase, this.symbols]);
		});
	}
	cycleT9(reverse: boolean = false) {
		if (typeof reverse !== 'boolean') {
			reverse = false;
		}
		if (this.suggestions.length <= 1) {
			//No point in cycling through a one-length array
			return;
		}

		const lastWordLength = splitNumString(this.state.currentNums).pop().arr.length;
		const lastWordStart = this.state.currentNums.length - lastWordLength;

		//Change the cycled state of the new num strings
		this.state.currentNums.forEach((num, index) => {
			if (index >= lastWordStart) {
				num.cycles += (reverse ? -1 : 1);
			}
		});

		this.setState({
			currentNums: this.state.currentNums,
			//First slice off the last X characters, where X is equal to the 
			//length of the last "word" using splitNumString
			currentText: this.state.currentText.slice(0, lastWordStart) +
					//Then append the next or previous suggestion modulo the length
					//to prevent overflows
					this.suggestions[
						(this.suggestions.indexOf(this.state.currentText.slice(lastWordStart)) +
							this.suggestions.length +
							(reverse ? -1 : 1)) % this.suggestions.length]
		});
	}
	
	_splitIntoWords(string: string, numstring: NumString): Array<{
		type: 'caps-word'|'word'|'non-word';
		str: string;
	}> {
		let index = 0;
		const words: Array<{
			type: 'caps-word'|'word'|'non-word';
			str: string;
		}> = [];
		splitNumString(numstring).forEach((splitPart) => {
			words.push({
				type: splitPart.type === 'T9' ? 'word' : 
					splitPart.type === 'T9Caps' ? 'caps-word' : 'non-word',
				str: string.slice(index, index += splitPart.arr.length)
			});
		});
		return words;
	}

	render() {
		return (
			<div id="mainScreen">
				<div id="mainText" ref={(mainText) => this.mainTextCont = mainText}>
					{this._splitIntoWords(this.state && this.state.currentText || '', 
						this.state && this.state.currentNums || [])
						.map((word, index, arr) => {
							const styles: React.CSSProperties = {};
							if (index === arr.length - 1 && word.type !== 'non-word') {
								styles.textDecoration = 'underline';
								return <span key={index} className="mainTextWord" style={styles}>{word.str}</span>;
							} 
							if (word.str === ' ') {
								return <span key={index} className="mainTextSpace">&nbsp;</span>
							}
							return (
								<span key={index} className="mainTextGroupCont">
									<span className="mainTextWord" style={styles}>{word.str}</span>
								</span>
							);
						})}
					<span className="cursor">|</span>
				</div>
				<div id="textButtons">
					<div className="textButton" id="capitalizeButton"
						onClick={this.toggleCapitalization.bind(this)}
						ref={(capButton) => this.capitalizeButton = capButton}>
						<svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
							<path d="M0 0h24v24H0z" fill="none"/>
							<path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
						</svg>
					</div>
					<div className="textButton" id="symbolsButton"
						onClick={this.toggleSymbols.bind(this)}
						ref={(symbolButton) => this.symbolButton = symbolButton}>
						<div className="textSymbol">123</div>
					</div>
					<div className="textButton" id="sendButton"
						onClick={this.sendPress.bind(this)}>
						<svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
							<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
							<path d="M0 0h24v24H0z" fill="none"/>
						</svg>
					</div>
				</div>
			</div>
		)
	}
}

export class MainFace extends React.Component<any, any> {
	props: {
		comm: CommHandlers;
		t9Lib: T9Defs
	};
	slices: Array<T9Slice> = [];

	constructor(props) {
		super(props);
	}
	render() {
		return (
			<div id="mainFace">
				<div id="faceCenter">
					<div className="horizontalCenterer">
						<div className="verticalCenterer">
							<div className="centered">
								<div id="faceSlices">
									{divideCircle(CIRCLE_DEGREES, SLICES)
										.map((slice: {
											index: number;
											angle: number;
										}, index, arr) => {
											return <T9Slice ref={(slice) => {
												this.slices.push(slice);
											}} key={slice.index} data={slice} comm={this.props.comm}/>
										})}										
								</div>
								<WatchScreen parent={this} t9Lib={this.props.t9Lib} comm={this.props.comm}/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
};

export class ChooseSymbol extends React.Component<any, any> {
	state: {
		chars: Array<string|number>;
		angle: number;
		hidden: boolean;
	}
	mainCont: HTMLElement;
	slices: Array<Slice>;

	constructor(props) {
		super(props);

		this.state = {
			chars: [],
			angle: 0,
			hidden: true
		}
	}
	addSymbols(chars: Array<string|number>, angle: number) {
		this.setState({
			chars: chars.reverse(),
			angle: angle,
			hidden: false
		});
	}
	hide() {
		this.setState({
			chars: this.state.chars,
			angle: this.state.angle,
			hidden: true
		});
	}
	show() {
		this.setState({
			chars: this.state.chars,
			angle: this.state.angle,
			hidden: false
		});
	}
	render() {
		const oppositeAngle = (this.state.angle + 67.5) % 360;
		const angles = divideCircle(PRECISION_SYMBOL_SELECTION_ANGLE,
			this.state.chars.length).map((slice: any, index) => {
				slice.symbol = this.state.chars[index];
				slice.angle = (slice.angle + oppositeAngle) % 360;
				return slice;
			});
		this.slices = [];
		
		const centerAngle = this.state.chars.length > 0 ?
			this.state.chars.length % 2 === 0 ?
				(angles[angles.length / 2].angle + 
				angles[(angles.length / 2) - 1].angle) / 2 :
					angles[Math.floor(angles.length / 2)].angle :
						0;

		const cancelButtonData = {
			angle: (centerAngle + 180) % 360,
			index: 27
		};

		return (
			<div ref={(mainCont) => {this.mainCont = mainCont}}
				className={this.state.hidden ? 'chooseSymbolContainer hidden' : 'chooseSymbolContainer'}>
				{this.state.hidden ? 
					'' :
					<div className="chooseSymbolCont">
						{angles.map((slice: {
							index: number;
							angle: number;
							symbol: string|number;
						}) => {
							return <Slice ref={(slice) => {
								this.slices.push(slice);
							}} key={slice.index} data={slice}
								isBig={true} comm={this.props.comm} />;
						})}
						<div className="chooseSymbolCancel">
							<Slice data={cancelButtonData}
								isExit={true} isBig={true}
								comm={this.props.comm} />
						</div>
					</div>
				}
			</div>
		)
	}
}