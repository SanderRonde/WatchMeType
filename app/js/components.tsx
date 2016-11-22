import * as React from 'react';
/// <reference path="./defs.d.ts" />

const CIRCLE_DEGREES = 360;
const SLICES = 8;
const T9_SLICE_DEGREES = CIRCLE_DEGREES / SLICES;
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

/**
 * Converts an object to an array of its members
 * 
 * @param {Object} obj - The object to array-ify
 * 
 * @return {any[]} Its members
 */
function objToArr<T>(obj: {
	[key: string]: T;
}): Array<T> {
	return Object.getOwnPropertyNames(obj).map((index) => {
		return obj[index];
	});
}

const T9Arr = objToArr(T9Keymap);

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
	['space_bar', ' ']
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
 * @param {boolean} isCaps - Whether it's in upper case
 * @param {boolean} isTextSymbol - Whether it's a symbol (@#$% etc)
 * 
 * @return {Object} The symbol for that position
 */
function getSymbol(index: number, isCaps: boolean, isTextSymbol: boolean): {
	isIcon: boolean;
	symbol: string;
	value: string;
} {
	if (isCaps || isTextSymbol) {
		debugger;
	}
	if (isTextSymbol) {
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
		};
		isT9: boolean;
	}

	constructor(props: {
		comm: CommHandlers
	}) {
		super(props);

		this.state = this.state || {};
		this.state.isCapitalized = false;
		this.state.isTextSymbol = false;

		props.comm.addSymbolListener(this.props.data.angle + 90, this, (type, data) => {
			switch (type) {
				case SymbolCommType.intensityUpdate:
					if (data < 0 || data !== this.opacity) {
						this.glow.style.opacity = String(data);
						this.opacity = data as number;
					}
					break;
				case SymbolCommType.fired:
					if (this.props.isT9) {
						break;
					}

					this.symbolCont.style.fontWeight = 'bold';
					
					if (this.firedTimeout) {
						window.clearTimeout(this.firedTimeout);
					}
					this.firedTimeout = window.setTimeout(() => {
						this.firedTimeout = -1;
						this.symbolCont.style.fontWeight = 'normal';
					}, 1000);
					break;
				case SymbolCommType.updateTextType:
					this.setState({
						isCapitalized: data[0] as boolean,
						isTextSymbol: data[1] as boolean
					});
					break;
			}
		});
	}
	render() {
		const styles = {
			transform: `rotate(${-this.props.data.angle}deg)`
		};

		let symbolData;
		if (this.props.data.index === 26) {
			symbolData = {
				isIcon: false,
				symbol: '',
				value: ''
			}
		} else {
			symbolData = getSymbol(this.props.data.index, this.state.isCapitalized,
				this.state.isTextSymbol);
			this.symbol = symbolData;
		}

		return (
			<div className="symbolCont" ref={(symbolCont) => this.symbolCont = symbolCont}>
				<div className="symbolGlow" ref={(glow) => this.glow = glow}></div>
				<div className="symbol" style={styles}>
					{symbolData.isIcon ? 
						<i className="material-icon">{symbolData.symbol}</i> :
						symbolData.symbol}
				</div>
			</div>
		)
	}
}

class Slice extends React.Component<any, any> implements SliceElement {
	child: Symbol;
	constructor(props) {
		super(props);
	}
	render() {
		const styles = {
			transform: `rotate(${this.props.data.angle}deg)`
		};

		return (
			<div className="slice" style={styles}>
				<Symbol ref={SymbolEl => this.child = SymbolEl} 
					data={this.props.data} comm={this.props.comm}
					isT9={this.props.isT9} />
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
	centerSliceBackground: SVGElement;
	colorTimeout: number = -1;
	children: Array<Slice> = [];

	constructor(props: T9SliceProps) {
		super(props);

		props.comm.addSymbolListener(this.props.data.angle + 90, this, (type) => {
			switch (type) {
				case SymbolCommType.fired:
					this.centerSliceBackground.classList.add('toggled');
					if (this.colorTimeout) {
						window.clearTimeout(this.colorTimeout);
					}
					this.colorTimeout = window.setTimeout(() => {
						this.colorTimeout = -1;
						this.centerSliceBackground.classList.remove('toggled');
					}, 1000);
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
						<path className="T9SliceCenter" 
							d={getSvgPathForSlice(startAngle, centerSliceSize)}
							ref={centerSliceBackground => this.centerSliceBackground = 
								centerSliceBackground}>
						</path>
						<path className="T9SliceBorder" 
							d={getSvgPathForSlice(startAngle + (centerSliceSize / 2),
								1)}></path>
					</svg>
				</div>
				{sliceData.map((slice) => {
					return <Slice ref={(sliceEl) => {this.children.push(sliceEl)}}
						key={slice.index} isT9={true} data={slice} comm={this.props.comm} />;
				})}
			</div>
		);
	}
}

function predictNumString(t9Lib: T9Defs, numstring: string): Array<string> {
	const res = t9Lib.predict(numstring);
	if (res && res.length > 0) {
		return res;
	}
	return [numstring.split('').map((num) => {
		return T9Keymap[num][0];
	}).join('')];
}

class WatchScreen extends React.Component<any, any> {
	state: {
		currentText?: string;
		currentNums?: string;
	}
	props: {
		comm: CommHandlers;
		useT9: boolean;
		t9Lib: T9Defs;
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
				case MainFaceCommType.keyPressed:
					this.addChar(data as string);
					break;
				case MainFaceCommType.T9KeyPressed:
					this.addNum(data as number);
					break;
			}
		});
	}

	_flashElement(element: HTMLElement) {
		element.classList.add('active');
		window.setTimeout(() => {
			element.classList.remove('active');
		}, 100);
	}

	addChar(char: string) {
		this.state = this.state || {
			currentText: ''
		};

		const wasScrolledToBottom = this.mainTextCont.scrollTop === 
			this.mainTextCont.scrollHeight;

		this.setState({
			currentText: this.state.currentText + char
		});

		if (wasScrolledToBottom) {
			window.setTimeout(() => {
				this.mainTextCont.scrollTop = this.mainTextCont.scrollHeight;			
			}, 0);
		}
	}
	addNum(num: number|' ') {
		this.state = this.state || {
			currentNums: '',
			currentText: ''
		};

		const wasScrolledToBottom = this.mainTextCont.scrollTop === 
			this.mainTextCont.scrollHeight;

		const newNums = this.state.currentNums + num;
		const oldString = this.state.currentText;
		const oldStringSplit = oldString.split(' ');

		this.suggestions = predictNumString(
			this.props.t9Lib, newNums.split(' ').pop());
		oldStringSplit[oldStringSplit.length - 1] = this.suggestions[0];

		this.setState({
			currentNums: newNums,
			currentText: newNums.split(' ').map((numstring) => {
				return predictNumString(this.props.t9Lib, numstring)[0];
			}).join(' ')
		});

		if (wasScrolledToBottom) {
			window.setTimeout(() => {
				this.mainTextCont.scrollTop = this.mainTextCont.scrollHeight;			
			}, 0);
		}
	}
	addSpace() {
		this.addChar(' ');
		if (this.props.useT9) {
			this.addNum(' ');
		}
	}
	deleteChar() {
		this.state = this.state || {
			currentText: '',
			currentNums: ''
		};
		let newState;
		if (this.props.useT9) {
			const textSplit = this.state.currentText.split(' ');
			const newNums = this.state.currentNums.slice(0, -1);

			this.suggestions = predictNumString(this.props.t9Lib, newNums.split(' ').pop());

			newState = {
				currentNums: newNums,
				currentText: newNums.split(' ').map((numstring, index, arr) => {
					if (index === arr.length - 1) {
						return predictNumString(this.props.t9Lib, numstring)[0];
					} else {
						return textSplit[index];
					}
				}).join(' ')
			}
		} else {
			newState = {
				currentText: this.state.currentText.slice(0, -1)
			};
		}
		this.setState(newState);
	}
	sendPress() {
		this.props.comm.sendMessageToController(ControllerCommType.send,
			this.state.currentText);
		
		this.setState({
			currentText: '',
			currentNums: ''
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
	cycleT9(reverse = false) {
		this.setState({
			currentNums: this.state.currentNums,
			currentText: this.state.currentText.split(' ').slice(0, -1).concat(
				this.suggestions[
					(this.suggestions.indexOf(this.state.currentText.split(' ').pop()) +
						(reverse ? -1 : 1)) % this.suggestions.length]
			).join(' ')
		});
	}
	render(this) {
		return (
			<div id="mainScreen">
				<div id="mainText" ref={(mainText) => this.mainTextCont = mainText}>
					{(this.state && this.state.currentText || '').split(' ')
						.map((word: string, index, arr) => {
							const styles: React.CSSProperties = {};
							if (index === arr.length - 1) {
								styles.textDecoration = 'underline';
								return <span key={index} className="mainTextWord" style={styles}>{word}</span>;
							}
							return (
								<span key={index} className="mainTextGroupCont">
									<span className="mainTextWord" style={styles}>{word}</span>
									<span className="mainTextSpace">{' '}</span>
								</span>
							);
						})}
				</div>
				<div id="textButtons">
					<div className="textButton" id="backspaceButton"
						onClick={this.deleteChar.bind(this)}
						ref={backspaceButton => this.backspaceButton = backspaceButton}>
						<svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
							<path d="M0 0h24v24H0z" fill="none"/>
							<path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/>
						</svg>
					</div>
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
					<div className="textButton" id="cycleButton"
						onClick={this.cycleT9.bind(this)}
						ref={(cycleButton) => this.cycleButton = cycleButton}>
						<svg height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
							<path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
							<path d="M0 0h24v24H0z" fill="none"/>
						</svg>
					</div>
					<div className="textButton" id="spacebarButton"
						onClick={this.addSpace.bind(this)}
						ref={spacebarButton => this.spacebarButton = spacebarButton}>
						<svg height="56" viewBox="0 0 24 24" width="56" xmlns="http://www.w3.org/2000/svg">
							<path d="M0 0h24v24H0V0z" fill="none"/>
							<path d="M18 9v4H6V9H4v6h16V9z"/>
						</svg>
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
		useT9: boolean;
		comm: CommHandlers;
		t9Lib: T9Defs
	};

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
									{this.props.useT9 ?
										divideCircle(CIRCLE_DEGREES, SLICES)
											.map((slice: {
												index: number;
												angle: number;
											}, index, arr) => {
												return <T9Slice key={slice.index}
													data={slice} comm={this.props.comm}/>
											}) 
										: 
										divideCircle(CIRCLE_DEGREES, CIRCLE_SLICES)
											.map((slice) => {
												return <Slice key={slice.index} 
													data={slice} comm={this.props.comm} />;
										})
									}
								</div>
								<WatchScreen useT9={this.props.useT9}
									t9Lib={this.props.t9Lib} comm={this.props.comm}/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
};