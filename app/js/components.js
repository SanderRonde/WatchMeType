"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var CIRCLE_DEGREES = 360;
var T9_SLICE_DEGREES = CIRCLE_DEGREES / 9;
var T9Keymap = {
    1: 'abc',
    2: 'def',
    3: 'ghi',
    4: 'jkl',
    5: 'mno',
    6: 'pqr',
    7: 'stu',
    8: 'vwx',
    9: 'yz',
};
function divideCircle(maxAngle, entries) {
    var res = [];
    var angle = maxAngle / entries;
    for (var i = 0; i < entries; i++) {
        res[i] = {
            index: i,
            angle: -(maxAngle / 4) + (angle * i)
        };
    }
    return res;
}
var TEXT_CHARS = [
    ['space_bar', ' ']
].map(function (symbolPair) {
    return {
        symbol: symbolPair[0],
        value: symbolPair[1]
    };
});
var SYMBOLS = [
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
    '-', '+', '_', '=', '`', '~', ',', '.', '/', '?',
    '\'', '"', ';', ':', '[', '{', ']', '}', '\\', '|',
    '<', '>'
].map(function (sym) { return [sym]; }).slice().map(function (symbolPair) {
    if (symbolPair.length === 1) {
        symbolPair[1] = symbolPair[0];
    }
    return {
        symbol: symbolPair[0],
        value: symbolPair[1]
    };
});
function getSymbol(index, isCaps, isTextSymbol) {
    if (isTextSymbol) {
        if (index <= 9) {
            return {
                isIcon: false,
                symbol: String(index),
                value: String(index)
            };
        }
        else if (index < 26) {
            var char = SYMBOLS[index - 10 + (isCaps ? 16 : 0)];
            return {
                isIcon: false,
                symbol: char.symbol,
                value: char.value
            };
        }
        else {
            return {
                isIcon: true,
                symbol: 'space_bar',
                value: ' '
            };
        }
    }
    else {
        if (index < 26) {
            var charLowerCase = String.fromCharCode(index + 97);
            var char = (isCaps ? charLowerCase.toUpperCase() : charLowerCase);
            return {
                isIcon: false,
                symbol: char,
                value: char
            };
        }
        else {
            return {
                isIcon: true,
                symbol: TEXT_CHARS[index - 26].symbol,
                value: TEXT_CHARS[index - 26].value
            };
        }
    }
}
var CIRCLE_SLICES = 26;
var Symbol = (function (_super) {
    __extends(Symbol, _super);
    function Symbol(props) {
        var _this = this;
        _super.call(this, props);
        this.elName = 'Symbol';
        this.opacity = 0;
        this.firedTimeout = -1;
        this.state = this.state || {};
        this.state.isCapitalized = false;
        this.state.isTextSymbol = false;
        props.comm.addSymbolListener(this.props.data.angle + 90, this, function (type, data) {
            switch (type) {
                case 0:
                    if (data < 0 || data !== _this.opacity) {
                        _this.glow.style.opacity = String(data);
                        _this.opacity = data;
                    }
                    break;
                case 1:
                    if (_this.props.isT9) {
                        break;
                    }
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
                        isCapitalized: data[0],
                        isTextSymbol: data[1]
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
        var symbolData;
        if (this.props.data.index === 26) {
            symbolData = {
                isIcon: false,
                symbol: '',
                value: ''
            };
        }
        else {
            symbolData = getSymbol(this.props.data.index, this.state.isCapitalized, this.state.isTextSymbol);
            this.symbol = symbolData;
        }
        return (React.createElement("div", {className: "symbolCont", ref: function (symbolCont) { return _this.symbolCont = symbolCont; }}, 
            React.createElement("div", {className: "symbolGlow", ref: function (glow) { return _this.glow = glow; }}), 
            React.createElement("div", {className: "symbol", style: styles}, symbolData.isIcon ?
                React.createElement("i", {className: "material-icon"}, symbolData.symbol) :
                symbolData.symbol)));
    };
    return Symbol;
}(React.Component));
var Slice = (function (_super) {
    __extends(Slice, _super);
    function Slice(props) {
        _super.call(this, props);
    }
    Slice.prototype.render = function () {
        var _this = this;
        var styles = {
            transform: "rotate(" + this.props.data.angle + "deg)"
        };
        return (React.createElement("div", {className: "slice", style: styles}, 
            React.createElement(Symbol, {ref: function (SymbolEl) { return _this.child = SymbolEl; }, data: this.props.data, comm: this.props.comm, isT9: this.props.isT9})
        ));
    };
    return Slice;
}(React.Component));
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}
function describeArc(x, y, radius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}
function getSvgPathForSlice(centerAngle, size) {
    var halfSlice = size / 2;
    return describeArc(150, 150, 136, centerAngle - halfSlice, centerAngle + halfSlice);
}
var T9Slice = (function (_super) {
    __extends(T9Slice, _super);
    function T9Slice(props) {
        var _this = this;
        _super.call(this, props);
        this.elName = 'T9Slice';
        this.colorTimeout = -1;
        this.children = [];
        props.comm.addSymbolListener(this.props.data.angle + 90, this, function (type) {
            switch (type) {
                case 1:
                    _this.centerSliceBackground.classList.add('toggled');
                    if (_this.colorTimeout) {
                        window.clearTimeout(_this.colorTimeout);
                    }
                    _this.colorTimeout = window.setTimeout(function () {
                        _this.colorTimeout = -1;
                        _this.centerSliceBackground.classList.remove('toggled');
                    }, 1000);
                    break;
            }
        });
    }
    T9Slice.prototype.render = function () {
        var _this = this;
        var sliceData = divideCircle(CIRCLE_DEGREES / 9, 3).map(function (slice) {
            slice.angle += _this.props.data.angle;
            slice.index += _this.props.data.index * 3;
            return slice;
        });
        var centerSliceSize = T9_SLICE_DEGREES - 1;
        return (React.createElement("div", {className: "T9SliceCont"}, 
            React.createElement("div", {className: "T9SliceBackground"}, 
                React.createElement("svg", {viewBox: "0 0 300 300"}, 
                    React.createElement("path", {className: "T9SliceBorder", d: getSvgPathForSlice(sliceData[1].angle + 90 - (centerSliceSize / 2), 1)}), 
                    React.createElement("path", {className: "T9SliceCenter", d: getSvgPathForSlice(sliceData[1].angle + 90, centerSliceSize), ref: function (centerSliceBackground) { return _this.centerSliceBackground =
                        centerSliceBackground; }}), 
                    React.createElement("path", {className: "T9SliceBorder", d: getSvgPathForSlice(sliceData[1].angle + 90 + (centerSliceSize / 2), 1)}))
            ), 
            sliceData.map(function (slice) {
                return React.createElement(Slice, {ref: function (sliceEl) { _this.children.push(sliceEl); }, key: slice.index, isT9: true, data: slice, comm: _this.props.comm});
            })));
    };
    return T9Slice;
}(React.Component));
function predictNumString(t9Lib, numstring) {
    var res = t9Lib.predict(numstring)[0];
    if (res) {
        return res;
    }
    return numstring.split('').map(function (num) {
        return T9Keymap[num][0];
    }).join('');
}
var WatchScreen = (function (_super) {
    __extends(WatchScreen, _super);
    function WatchScreen(props) {
        var _this = this;
        _super.call(this, props);
        this.upperCase = false;
        this.symbols = false;
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
                case 2:
                    _this.addNum(data);
                    break;
            }
        });
    }
    WatchScreen.prototype.addChar = function (char) {
        var _this = this;
        this.state = this.state || {
            currentText: ''
        };
        var wasScrolledToBottom = this.mainTextCont.scrollTop ===
            this.mainTextCont.scrollHeight;
        this.setState({
            currentText: this.state.currentText + char
        });
        if (wasScrolledToBottom) {
            window.setTimeout(function () {
                _this.mainTextCont.scrollTop = _this.mainTextCont.scrollHeight;
            }, 0);
        }
    };
    WatchScreen.prototype.addNum = function (num) {
        var _this = this;
        this.state = this.state || {
            currentNums: '',
            currentText: ''
        };
        var wasScrolledToBottom = this.mainTextCont.scrollTop ===
            this.mainTextCont.scrollHeight;
        var newNums = this.state.currentNums + num;
        var oldString = this.state.currentText;
        var oldStringSplit = oldString.split(' ');
        oldStringSplit[oldStringSplit.length - 1] = predictNumString(this.props.t9Lib, newNums.split(' ').pop());
        this.setState({
            currentNums: newNums,
            currentText: newNums.split(' ').map(function (numstring) {
                return predictNumString(_this.props.t9Lib, numstring);
            }).join(' ')
        });
        if (wasScrolledToBottom) {
            window.setTimeout(function () {
                _this.mainTextCont.scrollTop = _this.mainTextCont.scrollHeight;
            }, 0);
        }
    };
    WatchScreen.prototype.addSpace = function () {
        this.addChar(' ');
        if (this.props.useT9) {
            this.addNum(' ');
        }
    };
    WatchScreen.prototype.deleteChar = function () {
        var _this = this;
        this.state = this.state || {
            currentText: '',
            currentNums: ''
        };
        var newState;
        if (this.props.useT9) {
            var textSplit_1 = this.state.currentText.split(' ');
            var newNums = this.state.currentNums.slice(0, -1);
            newState = {
                currentNums: newNums,
                currentText: newNums.split(' ').map(function (numstring, index, arr) {
                    if (index === arr.length - 1) {
                        return predictNumString(_this.props.t9Lib, numstring);
                    }
                    else {
                        return textSplit_1[index];
                    }
                }).join(' ')
            };
        }
        else {
            newState = {
                currentText: this.state.currentText.slice(0, -1)
            };
        }
        this.setState(newState);
    };
    WatchScreen.prototype.sendPress = function () {
        this.props.comm.sendMessageToController(0, this.state.currentText);
        this.setState({
            currentText: '',
            currentNums: ''
        });
    };
    WatchScreen.prototype.toggleCapitalization = function () {
        var _this = this;
        this.upperCase = !this.upperCase;
        this.capitalizeButton.classList[this.upperCase ? 'add' : 'remove']('toggled');
        this.props.comm._symbolListeners.forEach(function (symbolListener) {
            symbolListener.listener(2, [_this.upperCase, _this.symbols]);
        });
    };
    WatchScreen.prototype.toggleSymbols = function () {
        var _this = this;
        this.symbols = !this.symbols;
        this.symbolButton.classList[this.symbols ? 'add' : 'remove']('toggled');
        this.props.comm._symbolListeners.forEach(function (symbolListener) {
            symbolListener.listener(2, [_this.upperCase, _this.symbols]);
        });
    };
    WatchScreen.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", {id: "mainScreen"}, 
            React.createElement("div", {id: "mainText", ref: function (mainText) { return _this.mainTextCont = mainText; }}, (this.state && this.state.currentText || '').split(' ')
                .map(function (word, index, arr) {
                var styles = {};
                if (index === arr.length - 1) {
                    styles.textDecoration = 'underline';
                    return React.createElement("span", {key: index, className: "mainTextWord", style: styles}, word);
                }
                return (React.createElement("span", {key: index, className: "mainTextGroupCont"}, 
                    React.createElement("span", {className: "mainTextWord", style: styles}, word), 
                    React.createElement("span", {className: "mainTextSpace"}, ' ')));
            })), 
            React.createElement("div", {id: "textButtons"}, 
                React.createElement("div", {className: "textButton", id: "backspaceButton", onClick: this.deleteChar.bind(this)}, 
                    React.createElement("svg", {height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                        React.createElement("path", {d: "M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "capitalizeButton", onClick: this.toggleCapitalization.bind(this), ref: function (capButton) { return _this.capitalizeButton = capButton; }}, 
                    React.createElement("svg", {height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                        React.createElement("path", {d: "M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "symbolsButton", onClick: this.toggleSymbols.bind(this), ref: function (symbolButton) { return _this.symbolButton = symbolButton; }}, 
                    React.createElement("div", {className: "textSymbol"}, "123")
                ), 
                React.createElement("div", {className: "textButton", id: "spacebarButton", onClick: this.addSpace.bind(this)}, 
                    React.createElement("svg", {height: "56", viewBox: "0 0 24 24", width: "56", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0V0z", fill: "none"}), 
                        React.createElement("path", {d: "M18 9v4H6V9H4v6h16V9z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "sendButton", onClick: this.sendPress.bind(this)}, 
                    React.createElement("svg", {height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
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
                            React.createElement("div", {id: "faceSlices"}, this.props.useT9 ?
                                divideCircle(CIRCLE_DEGREES, 9)
                                    .map(function (slice, index, arr) {
                                    return React.createElement(T9Slice, {key: slice.index, data: slice, comm: _this.props.comm});
                                })
                                :
                                    divideCircle(CIRCLE_DEGREES, CIRCLE_SLICES)
                                        .map(function (slice) {
                                        return React.createElement(Slice, {key: slice.index, data: slice, comm: _this.props.comm});
                                    })), 
                            React.createElement(WatchScreen, {useT9: this.props.useT9, t9Lib: this.props.t9Lib, comm: this.props.comm}))
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