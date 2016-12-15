"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var util = require('./util');
var CIRCLE_DEGREES = 360;
var SLICES = 8;
var T9_SLICE_DEGREES = CIRCLE_DEGREES / SLICES;
var PRECISION_SYMBOL_SELECTION_ANGLE = 240;
var T9Keymap = {
    1: 'abc',
    2: 'def',
    3: 'ghi',
    4: 'jkl',
    5: 'mno',
    6: 'pqrs',
    7: 'tuv',
    8: 'wxyz'
};
var isCaps = false;
var isSymbol = false;
var T9Arr = util.objToArr(T9Keymap);
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
    ['space_bar', ' '],
    ['close', '']
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
function getSymbol(index) {
    if (isSymbol) {
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
        props.isBig || props.comm.addSymbolListener(this.props.data.angle + 90, this, function (type, data) {
            switch (type) {
                case 0:
                    if (data < 0 || data !== _this.opacity) {
                        _this.glow.style.opacity = String(data);
                        _this.opacity = data;
                    }
                    break;
                case 2:
                    _this.setState({
                        isCapitalized: data[0],
                        isTextSymbol: data[1]
                    });
                    isCaps = data[0];
                    isSymbol = data[1];
                    break;
            }
        });
    }
    Symbol.prototype.getClassName = function () {
        return 'symbolCont' + (this.props.isBig ? ' big' : '') +
            (this.props.isExit ? ' exit' : '');
    };
    Symbol.prototype.render = function () {
        var _this = this;
        var styles = {
            transform: "rotate(" + -this.props.data.angle + "deg)"
        };
        var symbolData;
        if (this.props.data.symbol) {
            symbolData = {
                isIcon: false,
                symbol: this.props.data.symbol,
                value: this.props.data.symbol
            };
        }
        else if (this.props.data.index === 26) {
            symbolData = {
                isIcon: false,
                symbol: '',
                value: ''
            };
        }
        else {
            symbolData = getSymbol(this.props.data.index);
        }
        this.symbol = symbolData;
        var symbolEl;
        window.setTimeout(function () {
            if (_this.props.isBig) {
                var bcr = symbolEl.getBoundingClientRect();
                var vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
                _this.area = {
                    x: bcr.left,
                    y: bcr.top + (vmin * 3.5),
                    radius: vmin * 10.5
                };
            }
        }, 0);
        return (React.createElement("div", {className: this.getClassName(), ref: function (symbolCont) { return _this.symbolCont = symbolCont; }}, 
            React.createElement("div", {className: "symbolGlow", ref: function (glow) { return _this.glow = glow; }}), 
            React.createElement("div", {ref: function (el) {
                symbolEl = el;
            }, className: "symbol", style: styles}, symbolData.isIcon ?
                React.createElement("i", {className: "material-icon default-size"}, symbolData.symbol) :
                symbolData.symbol)));
    };
    return Symbol;
}(React.Component));
var Slice = (function (_super) {
    __extends(Slice, _super);
    function Slice(props) {
        _super.call(this, props);
    }
    Slice.prototype.getClassName = function () {
        return 'slice' + (this.props.isBig ? ' big' : '') +
            (this.props.isExit ? ' exit' : '');
    };
    Slice.prototype.render = function () {
        var _this = this;
        var styles = {
            transform: "rotate(" + this.props.data.angle + "deg)"
        };
        return (React.createElement("div", {ref: function (sliceEl) { _this.sliceEl = sliceEl; }, className: this.getClassName(), style: styles}, 
            React.createElement(Symbol, {ref: function (SymbolEl) { return _this.child = SymbolEl; }, isBig: this.props.isBig, isExit: this.props.isExit, data: this.props.data, comm: this.props.comm})
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
        this.children = [];
        props.comm.addSymbolListener(this.props.data.angle + 90, this, function (type, data) {
            switch (type) {
                case 1:
                    var displacedPixels_1 = data;
                    _this.children.forEach(function (slice) {
                        slice.sliceEl.style.width = "calc(45vmin + " + displacedPixels_1 + "px)";
                    });
                    _this.centerSliceBackground.style['will-change'] =
                        'width, height, margin-left, margin-top';
                    _this.centerSliceBackground.style.width = "calc(98vmin + " + displacedPixels_1 * 2 + "px)";
                    _this.centerSliceBackground.style.height = "calc(98vmin + " + displacedPixels_1 * 2 + "px)";
                    _this.centerSliceBackground.style.marginLeft = -displacedPixels_1 + "px";
                    _this.centerSliceBackground.style.marginTop = -displacedPixels_1 + "px";
                    _this.centerSliceBackground.children[0].classList.add('toggled');
                    break;
            }
        });
    }
    T9Slice.prototype.render = function () {
        var _this = this;
        var symbols = T9Keymap[this.props.data.index + 1].length;
        var prevLetters = T9Arr.slice(0, this.props.data.index).join('').length;
        var sliceData = divideCircle(CIRCLE_DEGREES / SLICES, symbols).map(function (slice) {
            slice.angle += _this.props.data.angle;
            if (symbols > 3) {
                slice.angle -= 2.5;
            }
            slice.index += prevLetters;
            return slice;
        });
        var centerSliceSize = T9_SLICE_DEGREES - 1;
        var startAngle = 3.75 + (this.props.data.index * 45);
        return (React.createElement("div", {className: "T9SliceCont"}, 
            React.createElement("div", {className: "T9SliceBackground"}, 
                React.createElement("svg", {viewBox: "0 0 300 300"}, 
                    React.createElement("path", {className: "T9SliceBorder", d: getSvgPathForSlice(startAngle - (centerSliceSize / 2), 1)}), 
                    React.createElement("path", {className: "T9SliceBorder", d: getSvgPathForSlice(startAngle + (centerSliceSize / 2), 1)})), 
                React.createElement("svg", {viewBox: "0 0 300 300", ref: function (centerSliceBackground) { return _this.centerSliceBackground =
                    centerSliceBackground; }}, 
                    React.createElement("path", {className: "T9SliceCenter", d: getSvgPathForSlice(startAngle, centerSliceSize)})
                )), 
            sliceData.map(function (slice) {
                return React.createElement(Slice, {ref: function (sliceEl) { _this.children.push(sliceEl); }, key: slice.index, data: slice, comm: _this.props.comm});
            })));
    };
    return T9Slice;
}(React.Component));
function splitNumString(numstring) {
    if (numstring.length === 0) {
        return [];
    }
    var prevType = numstring[0].type;
    var arr = [{
            type: prevType,
            arr: [],
            cycles: numstring[0].cycles
        }];
    for (var i = 0; i < numstring.length; i++) {
        if (prevType === numstring[i].type) {
            arr[arr.length - 1].arr.push(numstring[i].data);
        }
        else {
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
function predictNumString(t9Lib, numstring) {
    var isCaps = numstring.type === 'T9Caps';
    if (numstring.type === 'T9' || isCaps) {
        var predicted = t9Lib.predict(numstring.arr.join(''));
        if (predicted && predicted.length > 0) {
            return isCaps ? predicted.map(function (str) { return str.toUpperCase(); }) : predicted;
        }
        return [numstring.arr.map(function (num) {
                return isCaps ? T9Arr[num - 1][0].toUpperCase() : T9Arr[num - 1][0];
            }).join('')];
    }
    return [numstring.arr.join('')];
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
                        case 1:
                            _this.deleteChar();
                            _this._flashElement(_this.backspaceButton);
                            break;
                        case 2:
                            _this.addSpace();
                            _this._flashElement(_this.spacebarButton);
                            break;
                        case 3:
                            _this.cycleT9(true);
                            _this._flashElement(_this.cycleButton);
                            break;
                        case 4:
                            _this.cycleT9();
                            _this._flashElement(_this.cycleButton);
                            break;
                    }
                    break;
                case 2:
                    _this.addNum(data, false);
                    _this._resetSlices();
                    break;
                case 4:
                    _this.addNum(data, true);
                    _this._resetSlices();
                    break;
                case 3:
                    _this._resetSlices();
                    break;
                case 5:
                    switch (data) {
                        case 'Backspace':
                            _this.deleteChar();
                            break;
                        case ' ':
                            _this.addSpace();
                            break;
                        case 'ArrowUp':
                            _this.cycleT9(false);
                            break;
                        case 'ArrowDown':
                            _this.cycleT9(true);
                            break;
                    }
                    break;
            }
        });
    }
    WatchScreen.prototype._resetSlices = function () {
        this.props.parent.slices.forEach(function (slice) {
            slice.children.forEach(function (symbol) {
                symbol.sliceEl.style.width = '45vmin';
            });
            slice.centerSliceBackground.style['will-change'] = 'auto';
            slice.centerSliceBackground.style.width = "98vmin";
            slice.centerSliceBackground.style.height = "98vmin";
            slice.centerSliceBackground.style.marginLeft = '0px';
            slice.centerSliceBackground.style.marginTop = '0px';
            slice.centerSliceBackground.children[0].classList.remove('toggled');
        });
    };
    WatchScreen.prototype._flashElement = function (element) {
        element.classList.add('active');
        window.setTimeout(function () {
            element.classList.remove('active');
        }, 100);
    };
    WatchScreen.prototype.addNum = function (num, isChar) {
        var _this = this;
        this.state = this.state || {
            currentNums: [],
            currentText: ''
        };
        var lastChar = this.state.currentNums.slice(-1)[0];
        if (num === ' ' && lastChar && lastChar.type === 'char' && lastChar.data === ' ') {
            this.state.currentNums[this.state.currentNums.length - 1].data = '.';
            this.state.currentText = this.state.currentText.slice(0, -1) + '.';
        }
        var wasScrolledToBottom = this.mainTextCont.scrollTop <=
            this.mainTextCont.scrollHeight;
        var addedObj = {
            cycles: 0
        };
        if (isChar) {
            addedObj.type = 'char';
            addedObj.data = num;
        }
        else if (isCaps || isSymbol || typeof num === 'string') {
            if (isCaps && !isSymbol) {
                addedObj.type = 'T9Caps';
                addedObj.data = num;
            }
            else {
                addedObj.type = 'char';
                addedObj.data = typeof num === 'number' ? getSymbol(num * 3).value : num;
            }
        }
        else {
            addedObj.type = 'T9';
            addedObj.data = num;
        }
        var newNums = this.state.currentNums.concat(addedObj);
        var oldString = this.state.currentText;
        var oldStringSplit = oldString.split(' ');
        this.suggestions = predictNumString(this.props.t9Lib, splitNumString(newNums).pop());
        oldStringSplit[oldStringSplit.length - 1] = this.suggestions[0];
        this.setState({
            currentNums: newNums,
            currentText: splitNumString(newNums).map(function (numstring) {
                var predictions = predictNumString(_this.props.t9Lib, numstring);
                return predictions[(numstring.cycles + predictions.length)
                    % predictions.length];
            }).join('')
        });
        if (wasScrolledToBottom) {
            window.setTimeout(function () {
                _this.mainTextCont.scrollTop = _this.mainTextCont.scrollHeight;
            }, 0);
        }
    };
    WatchScreen.prototype.addSpace = function () {
        this.addNum(' ', true);
    };
    WatchScreen.prototype.deleteChar = function () {
        var _this = this;
        this.state = this.state || {
            currentText: '',
            currentNums: []
        };
        var textSplit = this.state.currentText.split(' ');
        var newNums = this.state.currentNums.slice(0, -1);
        var isEmpty = newNums.length === 0;
        this.suggestions = isEmpty ? [''] :
            predictNumString(this.props.t9Lib, splitNumString(newNums).pop());
        this.setState({
            currentNums: newNums,
            currentText: isEmpty ? '' : splitNumString(newNums).map(function (numstring) {
                var predictions = predictNumString(_this.props.t9Lib, numstring);
                return predictions[(numstring.cycles + predictions.length)
                    % predictions.length];
            }).join('')
        });
    };
    WatchScreen.prototype.sendPress = function () {
        this.props.comm.sendMessageToController(0, this.state.currentText);
        this.setState({
            currentText: '',
            currentNums: []
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
    WatchScreen.prototype.cycleT9 = function (reverse) {
        if (reverse === void 0) { reverse = false; }
        if (typeof reverse !== 'boolean') {
            reverse = false;
        }
        if (this.suggestions.length <= 1) {
            return;
        }
        var lastWordLength = splitNumString(this.state.currentNums).pop().arr.length;
        var lastWordStart = this.state.currentNums.length - lastWordLength;
        this.state.currentNums.forEach(function (num, index) {
            if (index >= lastWordStart) {
                num.cycles += (reverse ? -1 : 1);
            }
        });
        this.setState({
            currentNums: this.state.currentNums,
            currentText: this.state.currentText.slice(0, lastWordStart) +
                this.suggestions[(this.suggestions.indexOf(this.state.currentText.slice(lastWordStart)) +
                    this.suggestions.length +
                    (reverse ? -1 : 1)) % this.suggestions.length]
        });
    };
    WatchScreen.prototype._splitIntoWords = function (string, numstring) {
        var index = 0;
        var words = [];
        splitNumString(numstring).forEach(function (splitPart) {
            words.push({
                type: splitPart.type === 'T9' ? 'word' :
                    splitPart.type === 'T9Caps' ? 'caps-word' : 'non-word',
                str: string.slice(index, index += splitPart.arr.length)
            });
        });
        return words;
    };
    WatchScreen.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", {id: "mainScreen"}, 
            React.createElement("div", {id: "mainText", ref: function (mainText) { return _this.mainTextCont = mainText; }}, 
                this._splitIntoWords(this.state && this.state.currentText || '', this.state && this.state.currentNums || [])
                    .map(function (word, index, arr) {
                    var styles = {};
                    if (index === arr.length - 1 && word.type !== 'non-word') {
                        styles.textDecoration = 'underline';
                        return React.createElement("span", {key: index, className: "mainTextWord", style: styles}, word.str);
                    }
                    if (word.str === ' ') {
                        return React.createElement("span", {key: index, className: "mainTextSpace"}, " ");
                    }
                    return (React.createElement("span", {key: index, className: "mainTextGroupCont"}, 
                        React.createElement("span", {className: "mainTextWord", style: styles}, word.str)
                    ));
                }), 
                React.createElement("span", {className: "cursor"}, "|")), 
            React.createElement("div", {id: "textButtons"}, 
                React.createElement("div", {className: "textButton", id: "capitalizeButton", onClick: this.toggleCapitalization.bind(this), ref: function (capButton) { return _this.capitalizeButton = capButton; }}, 
                    React.createElement("svg", {height: "48", viewBox: "0 0 24 24", width: "48", xmlns: "http://www.w3.org/2000/svg"}, 
                        React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                        React.createElement("path", {d: "M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"}))
                ), 
                React.createElement("div", {className: "textButton", id: "symbolsButton", onClick: this.toggleSymbols.bind(this), ref: function (symbolButton) { return _this.symbolButton = symbolButton; }}, 
                    React.createElement("div", {className: "textSymbol"}, "123")
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
        this.slices = [];
    }
    MainFace.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", {id: "mainFace"}, 
            React.createElement("div", {id: "faceCenter"}, 
                React.createElement("div", {className: "horizontalCenterer"}, 
                    React.createElement("div", {className: "verticalCenterer"}, 
                        React.createElement("div", {className: "centered"}, 
                            React.createElement("div", {id: "faceSlices"}, divideCircle(CIRCLE_DEGREES, SLICES)
                                .map(function (slice, index, arr) {
                                return React.createElement(T9Slice, {ref: function (slice) {
                                    _this.slices.push(slice);
                                }, key: slice.index, data: slice, comm: _this.props.comm});
                            })), 
                            React.createElement(WatchScreen, {parent: this, t9Lib: this.props.t9Lib, comm: this.props.comm}))
                    )
                )
            )
        ));
    };
    return MainFace;
}(React.Component));
exports.MainFace = MainFace;
;
var ChooseSymbol = (function (_super) {
    __extends(ChooseSymbol, _super);
    function ChooseSymbol(props) {
        _super.call(this, props);
        this.state = {
            chars: [],
            angle: 0,
            hidden: true
        };
    }
    ChooseSymbol.prototype.addSymbols = function (chars, angle) {
        this.setState({
            chars: chars.reverse(),
            angle: angle,
            hidden: false
        });
    };
    ChooseSymbol.prototype.hide = function () {
        this.setState({
            chars: this.state.chars,
            angle: this.state.angle,
            hidden: true
        });
    };
    ChooseSymbol.prototype.show = function () {
        this.setState({
            chars: this.state.chars,
            angle: this.state.angle,
            hidden: false
        });
    };
    ChooseSymbol.prototype.render = function () {
        var _this = this;
        var oppositeAngle = (this.state.angle + 67.5) % 360;
        var angles = divideCircle(PRECISION_SYMBOL_SELECTION_ANGLE, this.state.chars.length).map(function (slice, index) {
            slice.symbol = _this.state.chars[index];
            slice.angle = (slice.angle + oppositeAngle) % 360;
            return slice;
        });
        this.slices = [];
        var centerAngle = this.state.chars.length > 0 ?
            this.state.chars.length % 2 === 0 ?
                (angles[angles.length / 2].angle +
                    angles[(angles.length / 2) - 1].angle) / 2 :
                angles[Math.floor(angles.length / 2)].angle :
            0;
        var cancelButtonData = {
            angle: (centerAngle + 180) % 360,
            index: 27
        };
        console.log(cancelButtonData);
        return (React.createElement("div", {ref: function (mainCont) { _this.mainCont = mainCont; }, className: this.state.hidden ? 'chooseSymbolContainer hidden' : 'chooseSymbolContainer'}, this.state.hidden ?
            '' :
            React.createElement("div", {className: "chooseSymbolCont"}, 
                angles.map(function (slice) {
                    return React.createElement(Slice, {ref: function (slice) {
                        _this.slices.push(slice);
                    }, key: slice.index, data: slice, isBig: true, comm: _this.props.comm});
                }), 
                React.createElement("div", {className: "chooseSymbolCancel"}, 
                    React.createElement(Slice, {data: cancelButtonData, isExit: true, isBig: true, comm: this.props.comm})
                ))));
    };
    return ChooseSymbol;
}(React.Component));
exports.ChooseSymbol = ChooseSymbol;
//# sourceMappingURL=components.js.map