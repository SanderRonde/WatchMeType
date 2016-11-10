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
function getSymbol(index) {
    if (index < 26) {
        return String.fromCharCode(index + 97);
    }
    else {
        return SYMBOLS[index - 26];
    }
}
var CIRCLE_SLICES = 26;
var Symbol = (function (_super) {
    __extends(Symbol, _super);
    function Symbol(props) {
        _super.call(this, props);
    }
    Symbol.prototype.render = function () {
        var styles = {
            transform: "rotate(" + -this.props.data.angle + "deg)"
        };
        return (React.createElement("div", {className: "symbolCont"}, 
            React.createElement("div", {className: "symbol", style: styles}, getSymbol(this.props.data.index).toUpperCase())
        ));
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
        _super.call(this, props);
    }
    WatchScreen.prototype.addChar = function (char) {
        this.state = this.state || {
            currentText: ''
        };
        this.setState({
            currentText: this.state.currentText + char
        });
    };
    WatchScreen.prototype.render = function () {
        return (React.createElement("div", {id: "mainScreen"}, 
            React.createElement("div", {id: "mainText"}, this.state && this.state.currentText || ''), 
            React.createElement("div", {id: "textButtons"}, 
                React.createElement("div", {id: "backspaceButton"}, "<-")
            )));
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