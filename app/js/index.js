"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var components = require('./components');
var util = require('./util');
var KEY_PRESSED_MIN_DISTANCE = 90;
var KEY_PRESSED_MAX_ANGLE_DIFF = 10;
var FINGER_ADJUSTMENT = 1.4;
var VMIN = Math.min(window.innerWidth, window.innerHeight) / 100;
var HALF_WINDOW_WIDTH = window.innerWidth / 2;
var HALF_WINDOW_HEIGHT = window.innerHeight / 2;
var CHOOSE_SYMBOL_ACTIVATION = 7;
var CANCEL_SPECIFIC_SYMBOL_MODE_ANGLE = 40;
var t9 = require('./libs/t9.js');
var hashSplit = window.location.hash.slice(1).split('-').map(function (option) {
    return option.toLowerCase();
});
var DEBUG = hashSplit.indexOf('d') > -1;
var LANG = hashSplit.indexOf('nl') > -1 ? 'dutch' : 'english';
var SHOWDOT = hashSplit.indexOf('dot') > -1;
if (!SHOWDOT) {
    document.getElementById('pointerDot').style.display = 'none';
}
if (DEBUG) {
    console.log("Using debug mode");
}
var symbolRadius = Math.min(window.innerWidth, window.innerHeight * 0.98) * 0.4;
var pressingKey = -1;
var isLoading = true;
var waitForReset = false;
var selectingT9LetterAngle = -1;
var pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};
var lastPointerPos = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};
function radiusFromCenter(pos) {
    var center = {
        x: HALF_WINDOW_WIDTH,
        y: HALF_WINDOW_HEIGHT
    };
    return Math.sqrt(Math.pow(center.x - pos.x, 2) + Math.pow(center.y - pos.y, 2));
}
function getGlowIntensity(symbolRadius, radius) {
    return Math.pow((Math.min(radius / symbolRadius, 1) * 100), 2) / 100;
}
function enterChooseSymbolMode(chars, angle) {
    selectingT9LetterAngle = angle;
    waitForReset = true;
    chooseSymbolOverlay.addSymbols(chars, angle);
}
var comm = {
    _symbolListeners: [],
    addSymbolListener: function (angle, symbol, listener) {
        comm._symbolListeners.push({
            angle: angle,
            element: symbol,
            listener: listener
        });
    },
    fireSymbolListeners: function (pos) {
        var gestureAngle = Math.atan2(pos.y - HALF_WINDOW_HEIGHT, pos.x - HALF_WINDOW_WIDTH) * 180 / Math.PI;
        if (gestureAngle < 0) {
            gestureAngle += 360;
        }
        gestureAngle = (gestureAngle + 90) % 360;
        var radius = radiusFromCenter(pos);
        if (waitForReset) {
            if (radius < symbolRadius * 0.5) {
                waitForReset = false;
            }
            else {
                return;
            }
        }
        if (selectingT9LetterAngle !== -1) {
            if (radius >= symbolRadius &&
                Math.abs(gestureAngle - selectingT9LetterAngle) <=
                    CANCEL_SPECIFIC_SYMBOL_MODE_ANGLE) {
                chooseSymbolOverlay.hide();
                selectingT9LetterAngle = -1;
                waitForReset = true;
            }
            return;
        }
        if (radius >= symbolRadius) {
            var maxGlowIntensity = getGlowIntensity(symbolRadius, radius);
            gestureAngle = (gestureAngle + (360 / 26)) % 360;
            if (maxGlowIntensity >= KEY_PRESSED_MIN_DISTANCE * 0.8) {
                var toggledIndex = comm._symbolListeners.length - 1;
                var lastSlice = 0;
                var broke = false;
                for (var i = 0; i < comm._symbolListeners.length; i++) {
                    if (comm._symbolListeners[i].element.elName === 'T9Slice') {
                        if (gestureAngle < comm._symbolListeners[i].angle) {
                            toggledIndex = lastSlice;
                            broke = true;
                            break;
                        }
                        lastSlice = i;
                    }
                }
                if (!broke) {
                    toggledIndex = lastSlice;
                }
                var displacedPixels = radius - symbolRadius;
                if (displacedPixels > CHOOSE_SYMBOL_ACTIVATION * VMIN) {
                    enterChooseSymbolMode(comm._symbolListeners[toggledIndex].element
                        .children.map(function (slice) {
                        return slice.child.symbol.symbol;
                    }), comm._symbolListeners[toggledIndex].angle);
                    comm._symbolListeners[toggledIndex].listener(1, 0);
                    comm._faceListeners.forEach(function (faceListener) {
                        faceListener(3);
                    });
                    pressingKey = -1;
                }
                else {
                    comm._symbolListeners[toggledIndex].listener(1, displacedPixels);
                    pressingKey = comm._symbolListeners[toggledIndex].element
                        .props.data.index + 1;
                }
            }
        }
        else if (pressingKey !== -1) {
            comm.fireMainFaceListener(2, pressingKey);
            pressingKey = -1;
        }
    },
    _faceListeners: [],
    addMainFaceListener: function (listener) {
        comm._faceListeners.push(listener);
    },
    fireMainFaceListener: function (type, data) {
        comm._faceListeners.forEach(function (listener) {
            listener(type, data);
        });
    },
    sendMessageToController: function (type, data) {
        switch (type) {
            case 0:
                alert("Sent message \"" + data + "\"");
                break;
        }
    },
    symbolHover: function (symbol) {
        comm.fireMainFaceListener(2, symbol);
        chooseSymbolOverlay.hide();
        selectingT9LetterAngle = -1;
        waitForReset = true;
    }
};
var chooseSymbolOverlay = ReactDOM.render(React.createElement(components.ChooseSymbol, {
    comm: comm
}), document.getElementById('chooseSymbolOverlay'));
ReactDOM.render(React.createElement(components.MainFace, {
    comm: comm,
    t9Lib: t9
}), document.getElementById('mainContainer'));
var pointerDot = document.getElementById('pointerDot');
function updatePointerPos() {
    if (lastPointerPos.x !== pointer.x || lastPointerPos.y !== pointer.y) {
        if (SHOWDOT) {
            pointerDot.style.top = (pointer.y - 7.5) + "px";
            pointerDot.style.left = (pointer.x - 7.5) + "px";
        }
        comm.fireSymbolListeners(pointer);
        lastPointerPos.x = pointer.x;
        lastPointerPos.y = pointer.y;
    }
    window.requestAnimationFrame(updatePointerPos);
}
if (DEBUG) {
    window.onmousemove = function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
    };
}
var websocket = new WebSocket('ws://localhost:1234', 'echo-protocol');
var pointerIcon = document.getElementById('pointerSpotted');
function getPointerRadius(vector, directionAngle) {
    var currentRatio = Math.abs(vector[2]) /
        (Math.abs(vector[0]) + Math.abs(vector[1]));
    return Math.min((1 / currentRatio) * FINGER_ADJUSTMENT, 1);
}
function getPointer2DDirection(vector) {
    var angle = Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
    return angle;
}
function handleGestures(data) {
    if (data.gesture === 0) {
        return false;
    }
    comm.fireMainFaceListener(1, data.gesture);
}
websocket.onmessage = function (event) {
    var stringifiedData = event.data;
    var data = JSON.parse(stringifiedData);
    var spottedGesture = handleGestures(data);
    if (data.foundPointer) {
        var pointer2DDirection = -getPointer2DDirection(data.direction) * (Math.PI / 180);
        var radiusPercentage = getPointerRadius(data.direction, pointer2DDirection);
        var radiusPx = radiusPercentage * symbolRadius;
        pointer.x = HALF_WINDOW_WIDTH +
            (Math.cos(pointer2DDirection) * radiusPx);
        pointer.y = HALF_WINDOW_HEIGHT +
            (Math.sin(pointer2DDirection) * radiusPx);
        pointerIcon.classList.remove('noPointer');
    }
    else if (!spottedGesture) {
        pointerIcon.classList.add('noPointer');
    }
};
function finishLoading() {
    document.getElementById('spinnerOverlay').style.opacity = '0';
    window.setTimeout(function () {
        document.getElementById('spinnerOverlay').style.display = 'none';
        isLoading = false;
        window.requestAnimationFrame(updatePointerPos);
    }, 500);
}
util.fetch("/resources/" + LANG + ".txt").then(function (res) {
    return res.text();
}).then(function (text) {
    t9.init(text);
    finishLoading();
});
//# sourceMappingURL=index.js.map