"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
function divideCircle(entries) {
    var res = [];
    var angle = 360 / entries;
    for (var i = 0; i < entries; i++) {
        res[i] = {
            index: i,
            angle: -90 + (angle * i)
        };
    }
    return res;
}
var SYMBOLS = [];
function getSymbol(index, isCaps) {
    if (index < 26) {
        var char = String.fromCharCode(index + 97);
        return (isCaps ? char.toUpperCase() : char);
    }
    else {
        return SYMBOLS[index - 26];
    }
}
var CIRCLE_SLICES = 26;
var Symbol = (function (_super) {
    __extends(Symbol, _super);
    function Symbol(props) {
        var _this = this;
        _super.call(this, props);
        this.opacity = 0;
        this.firedTimeout = -1;
        this.state = this.state || {};
        this.state.isCapitalized = false;
        props.comm.addSymbolListener(this.props.data.angle + 90, this, function (type, data) {
            switch (type) {
                case 0:
                    if (data !== _this.opacity) {
                        _this.glow.style.opacity = String(data);
                        _this.opacity = data;
                    }
                    break;
                case 1:
                    _this.symbolCont.style.fontWeight = 'bold';
                    if (_this.firedTimeout) {
                        window.clearTimeout(_this.firedTimeout);
                    }
                    _this.firedTimeout = window.setTimeout(function () {
                        _this.firedTimeout = -1;
                        _this.symbolCont.style.fontWeight = 'normal';
                    }, 1000);
                    break;
                case 2:
                    _this.setState({
                        isCapitalized: data
                    });
                    break;
            }
        });
    }
    Symbol.prototype.render = function () {
        var _this = this;
        var styles = {
            transform: "rotate(" + -this.props.data.angle + "deg)"
        };
        return (React.createElement("div", {className: "symbolCont", ref: function (symbolCont) { return _this.symbolCont = symbolCont; }}, 
            React.createElement("div", {className: "symbolGlow", ref: function (glow) { return _this.glow = glow; }}), 
            React.createElement("div", {className: "symbol", style: styles}, this.symbol =
                getSymbol(this.props.data.index, this.state.isCapitalized))));
    };
    return Symbol;
}(React.Component));
var Slice = (function (_super) {
    __extends(Slice, _super);
    function Slice(props) {
        _super.call(this, props);
    }
    Slice.prototype.render = function () {
        var styles = {
            transform: "rotate(" + this.props.data.angle + "deg)"
        };
        return (React.createElement("div", {className: "slice", style: styles}, 
            React.createElement(Symbol, {data: this.props.data, comm: this.props.comm})
        ));
    };
    return Slice;
}(React.Component));
var WatchScreen = (function (_super) {
    __extends(WatchScreen, _super);
    function WatchScreen(props) {
        var _this = this;
        _super.call(this, props);
        this.upperCase = false;
        props.comm.addMainFaceListener(function (type, data) {
            switch (type) {
                case 1:
                    switch (data) {
                        case 0:
                            _this.deleteChar();
                            break;
                        case 1:
                            _this.addSpace();
                            break;
                    }
                    break;
                case 0:
                    _this.addChar(data);
                    break;
            }
        });
    }
    WatchScreen.prototype.addChar = function (char) {
        this.state = this.state || {
            currentText: ''
        };
        this.setState({
            currentText: this.state.currentText + char
        });
    };
    WatchScreen.prototype.addSpace = function () {
        this.addChar(' ');
    };
    WatchScreen.prototype.deleteChar = function () {
        this.state = this.state || {
            currentText: ''
        };
        this.setState({
            currentText: this.state.currentText.slice(0, -1)
        });
    };
    WatchScreen.prototype.sendPress = function () {
        this.props.comm.sendMessageToController(0, this.state.currentText);
        this.setState({
            currentText: ''
        });
    };
    WatchScreen.prototype.toggleCapitalization = function () {
        var _this = this;
        this.upperCase = !this.upperCase;
        this.props.comm._symbolListeners.forEach(function (symbolListener) {
            symbolListener.listener(2, _this.upperCase);
        });
    };
    WatchScreen.prototype.render = function () {
        return (React.createElement("div", {id: "mainScreen"}, 
            React.createElement("div", {id: "mainText"}, this.state && this.state.currentText || ''), 
            React.createElement("div", {id: "textButtons"}, 
                React.createElement("div", {className: "textButton", id: "backspaceButton", onClick: this.deleteChar.bind(this)}, 
                    React.createElement("svg", {fill: "#FFFFFF", height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                        React.createElement("path", {d: "M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "capitalizeButton", onClick: this.toggleCapitalization.bind(this)}, 
                    React.createElement("svg", {fill: "#FFFFFF", height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                        React.createElement("path", {d: "M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "spacebarButton", onClick: this.addSpace.bind(this)}, 
                    React.createElement("svg", {fill: "#FFFFFF", height: "56", viewBox: "0 0 24 24", width: "56", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0V0z", fill: "none"}), 
                        React.createElement("path", {d: "M18 9v4H6V9H4v6h16V9z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "sendButton", onClick: this.sendPress.bind(this)}, 
                    React.createElement("svg", {fill: "#FFFFFF", height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"}), 
                        React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}))
                ))));
    };
    return WatchScreen;
}(React.Component));
var MainFace = (function (_super) {
    __extends(MainFace, _super);
    function MainFace(props) {
        _super.call(this, props);
    }
    MainFace.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", {id: "mainFace"}, 
            React.createElement("div", {id: "faceCenter"}, 
                React.createElement("div", {className: "horizontalCenterer"}, 
                    React.createElement("div", {className: "verticalCenterer"}, 
                        React.createElement("div", {className: "centered"}, 
                            React.createElement("div", {id: "faceSlices"}, divideCircle(CIRCLE_SLICES).map(function (slice) {
                                return React.createElement(Slice, {key: slice.index, data: slice, comm: _this.props.comm});
                            })), 
                            React.createElement(WatchScreen, {comm: this.props.comm}))
                    )
                )
            )
        ));
    };
    return MainFace;
}(React.Component));
exports.MainFace = MainFace;
;
//# sourceMappingURL=components.js.map