import * as React from 'react';
/// <reference path="./defs.d.ts" />

/**
 * Divides the circle in "entries" seperate slices
 * 
 * @param {number} entries - The amount of slices
 * 
 * @return {Object[]} The individual slices
 */
function divideCircle(entries: number): Array<{
	index: number;
	angle: number;
}> {
	const res: Array<{
		index: number;
		angle: number;
	}> = [];
	const angle = 360 / entries;
	for (let i = 0; i < entries; i++) {
		res[i] = {
			index: i,
			angle: -90 + (angle * i)
		};
	}
	return res;
}

const SYMBOLS = [];

/**
 * Gets the symbol for slice <at></at> index "index"
 * 
 * @param {number} index - The index of the symbol
 * @param {boolean} isCaps - Whether it's in upper case
 * 
 * @return {string} The symbol for that position
 */
function getSymbol(index: number, isCaps: boolean): string {
	if (index < 26) {
		const char = String.fromCharCode(index + 97);
		return (isCaps ? char.toUpperCase() : char);
	} else {
		return SYMBOLS[index - 26];
	}
}

const CIRCLE_SLICES = 26;

class Symbol extends React.Component<any, any> implements SymbolElement {
	symbol: string;
	glow: HTMLElement;
	opacity: number = 0;
	symbolCont: HTMLElement;
	firedTimeout: number = -1;
	props: {
		comm: CommHandlers,
		data: {
			angle: number;
			index: number;
		}
	}

	constructor(props: {
		comm: CommHandlers
	}) {
		super(props);

		this.state = this.state || {};
		this.state.isCapitalized = false;

		props.comm.addSymbolListener(this.props.data.angle + 90, this, (type, data) => {
			switch (type) {
				case SymbolCommType.intensityUpdate:
					if (data !== this.opacity) {
						this.glow.style.opacity = String(data);
						this.opacity = data as number;
					}
					break;
				case SymbolCommType.fired:
					this.symbolCont.style.fontWeight = 'bold';
					
					if (this.firedTimeout) {
						window.clearTimeout(this.firedTimeout);
					}
					this.firedTimeout = window.setTimeout(() => {
						this.firedTimeout = -1;
						this.symbolCont.style.fontWeight = 'normal';
					}, 1000);
					break;
				case SymbolCommType.updateCase:
					this.setState({
						isCapitalized: data as boolean
					});
					break;
			}
		});
	}
	render() {
		const styles = {
			transform: `rotate(${-this.props.data.angle}deg)`
		};

		return (
			<div className="symbolCont" ref={(symbolCont) => this.symbolCont = symbolCont}>
				<div className="symbolGlow" ref={(glow) => this.glow = glow}></div>
				<div className="symbol" style={styles}>
					{this.symbol = 
						getSymbol(this.props.data.index, this.state.isCapitalized)}
				</div>
			</div>
		)
	}
}

class Slice extends React.Component<any, any> {
	constructor(props) {
		super(props);
	}
	render() {
		const styles = {
			transform: `rotate(${this.props.data.angle}deg)`
		};

		return (
			<div className="slice" style={styles}>
				<Symbol data={this.props.data} comm={this.props.comm} />
			</div>
		);
	}
}

class WatchScreen extends React.Component<any, any> {
	state: {
		currentText?: string;
	}
	props: {
		comm: CommHandlers;
	};
	upperCase: boolean = false;

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
							break;
						case Gesture.space:
							this.addSpace();
							break;
					}
					break;
				case  MainFaceCommType.keyPressed:
					this.addChar(data as string);
					break;
			}
		});
	}
	addChar(char: string) {
		this.state = this.state || {
			currentText: ''
		};
		this.setState({
			currentText: this.state.currentText + char
		});
	}
	addSpace() {
		this.addChar(' ');
	}
	deleteChar() {
		this.state = this.state || {
			currentText: ''
		};
		this.setState({
			currentText: this.state.currentText.slice(0, -1)
		});
	}
	sendPress() {
		this.props.comm.sendMessageToController(ControllerCommType.send,
			this.state.currentText);
		
		this.setState({
			currentText: ''
		});
	}
	toggleCapitalization() {
		this.upperCase = !this.upperCase;
		this.props.comm._symbolListeners.forEach((symbolListener) => {
			symbolListener.listener(SymbolCommType.updateCase, this.upperCase);
		});
	}
	render(this) {
		return (
			<div id="mainScreen">
				<div id="mainText">
					{this.state && this.state.currentText || ''}
				</div>
				<div id="textButtons">
					<div className="textButton" id="backspaceButton"
						onClick={this.deleteChar.bind(this)}>
						<svg fill="#FFFFFF" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
							<path d="M0 0h24v24H0z" fill="none"/>
							<path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/>
						</svg>
					</div>
					<div className="textButton" id="capitalizeButton"
						onClick={this.toggleCapitalization.bind(this)}>
						<svg fill="#FFFFFF" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
							<path d="M0 0h24v24H0z" fill="none"/>
							<path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
						</svg>
					</div>
					<div className="textButton" id="spacebarButton"
						onClick={this.addSpace.bind(this)}>
						<svg fill="#FFFFFF" height="56" viewBox="0 0 24 24" width="56" xmlns="http://www.w3.org/2000/svg">
							<path d="M0 0h24v24H0V0z" fill="none"/>
							<path d="M18 9v4H6V9H4v6h16V9z"/>
						</svg>
					</div>
					<div className="textButton" id="sendButton"
						onClick={this.sendPress.bind(this)}>
						<svg fill="#FFFFFF" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
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
									{divideCircle(CIRCLE_SLICES).map((slice) => {
										return <Slice key={slice.index} data={slice} comm={this.props.comm} />;
									})}
								</div>
								<WatchScreen comm={this.props.comm}/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
};