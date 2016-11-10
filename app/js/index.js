"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var components = require('./components');
var Gesture;
(function (Gesture) {
})(Gesture || (Gesture = {}));
var comm = {};
ReactDOM.render(React.createElement(components.MainFace, {
    comm: comm
}), document.getElementById('mainContainer'));
//# sourceMappingURL=index.js.map