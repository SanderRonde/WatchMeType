import * as React from 'react';

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
 * Gets the symbol for slice at index "index"
 * 
 * @param {number} index - The index of the symbol
 * 
 * @return {string} The symbol for that position
 */
function getSymbol(index: number): string {
	if (index < 26) {
		return String.fromCharCode(index + 97);
	} else {
		return SYMBOLS[index - 26];
	}
}

const CIRCLE_SLICES = 26;

class Symbol extends React.Component<any, any> {
	constructor(props) {
		super(props);
	}
	render() {
		const styles = {
			transform: `rotate(${-this.props.data.angle}deg)`
		};

		return (
			<div className="symbolCont">
				<div className="symbol" style={styles}>
					{getSymbol(this.props.data.index).toUpperCase()}
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
	constructor(props) {
		super(props);
	}
	addChar(char: string) {
		this.state = this.state || {
			currentText: ''
		};
		this.setState({
			currentText: this.state.currentText + char
		});
	}
	render(this: {
		state?: {
			currentText?: string;
		}
	}) {
		return (
			<div id="mainScreen">
				<div id="mainText">
					{this.state && this.state.currentText || ''}
				</div>
				<div id="textButtons">
					<div id="backspaceButton">&lt;-</div>
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