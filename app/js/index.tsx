/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as components from './components';

interface PointerPosition {
	
}

enum Gesture {

}

const comm: {
	updatePos: (pos: PointerPosition) => void;
	gesture: (gesture: Gesture) => void;
} = {

} as any;

ReactDOM.render(React.createElement(components.MainFace, {
	comm: comm
}), document.getElementById('mainContainer'));