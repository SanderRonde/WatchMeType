"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var components = require('./components');
var constants = require('./constants');
window['constants'] = constants;
var t9 = require('./t9.js');
var hashSplit = window.location.hash.slice(1).split('-').map(function (option) {
    return option.toLowerCase();
});
var DEBUG = hashSplit.indexOf('d') > -1;
var USET9 = hashSplit.indexOf('t9') > -1;
var LANG = hashSplit.indexOf('nl') > -1 ? 'dutch' : 'english';
var SHOWDOT = hashSplit.indexOf('dot') > -1;
if (!SHOWDOT) {
    document.getElementById('pointerDot').style.display = 'none';
}
if (DEBUG) {
    console.log("Using debug mode");
}
var symbolRadius = Math.min(window.innerWidth, window.innerHeight * 0.98) *
    0.45;
var isLoading = true;
var cursorReset = true;
var pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};
var lastPointerPos = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};
function shouldFireListener(gestureAngle, listenerAngle) {
    return Math.abs(listenerAngle - listenerAngle) <= constants.get('GLOW_ANGLE');
}
function radiusFromCenter(pos) {
    var center = {
        x: constants.get('HALF_WINDOW_WIDTH'),
        y: constants.get('HALF_WINDOW_HEIGHT')
    };
    return Math.sqrt(Math.pow(center.x - pos.x, 2) + Math.pow(center.y - pos.y, 2));
}
function getGlowIntensity(symbolRadius, radius) {
    return Math.pow((Math.min(radius / symbolRadius, 1) * 100), 2) / 100;
}
function getAngleDifference(angle1, angle2) {
    if (angle1 >= 360 - constants.get('GLOW_ANGLE') &&
        angle2 <= constants.get('GLOW_ANGLE')) {
        angle2 += 360;
    }
    else if (angle2 >= 360 - constants.get('GLOW_ANGLE') &&
        angle1 <= constants.get('GLOW_ANGLE')) {
        angle1 += 360;
    }
    return Math.abs(angle1 - angle2);
}
function getAngleGlowIntensity(max, difference) {
    return (((constants.get('GLOW_ANGLE') -
        difference * constants.get('GLOW_ANGLE_FACTOR')) * max)
        / constants.get('GLOW_ANGLE')) || 0;
}
function keyPressed(glowIntensity, angleDifference) {
    return cursorReset && glowIntensity >= constants.get('KEY_PRESSED_MIN_DISTANCE') &&
        angleDifference <= constants.get('KEY_PRESSED_MAX_ANGLE_DIFF');
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
        var gestureAngle = Math.atan2(pos.y - constants.get('HALF_WINDOW_HEIGHT'), pos.x - constants.get('HALF_WINDOW_WIDTH')) * 180 / Math.PI;
        if (gestureAngle < 0) {
            gestureAngle += 360;
            ;
        }
        gestureAngle = (gestureAngle + 90) % 360;
        var radius = radiusFromCenter(pos);
        if (radius >= symbolRadius * (constants.get('GLOW_START_RADIUS_PERCENTAGE') / 100)) {
            var maxGlowIntensity_1 = getGlowIntensity(symbolRadius, radius);
            if (USET9) {
                gestureAngle = (gestureAngle + (360 / 26)) % 360;
                if (maxGlowIntensity_1 >= constants.get('KEY_PRESSED_MIN_DISTANCE') * 0.8 && cursorReset) {
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
                    comm._symbolListeners[toggledIndex].listener(1);
                    cursorReset = false;
                    console.log(comm._symbolListeners[toggledIndex].element
                        .props.data.index + 1);
                    comm.fireMainFaceListener(2, +comm._symbolListeners[toggledIndex].element
                        .props.data.index + 1);
                }
            }
            else {
                comm._symbolListeners.filter(function (listenerData) {
                    if (shouldFireListener(gestureAngle, listenerData.angle)) {
                        return true;
                    }
                    listenerData.listener(0, 0);
                }).forEach(function (listenerData) {
                    var angleDifference = getAngleDifference(gestureAngle, listenerData.angle);
                    listenerData.listener(0, getAngleGlowIntensity(maxGlowIntensity_1, angleDifference) / 100);
                    if (keyPressed(maxGlowIntensity_1, angleDifference)) {
                        cursorReset = false;
                        listenerData.listener(1);
                        comm.fireMainFaceListener(0, listenerData.element.symbol.value);
                    }
                });
            }
        }
        else {
            cursorReset = true;
            comm._symbolListeners.forEach(function (listenerData) {
                listenerData.listener(0, 0);
            });
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
    }
};
ReactDOM.render(React.createElement(components.MainFace, {
    comm: comm,
    useT9: USET9,
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
    return Math.min((1 / currentRatio) * constants.get('FINGER_ADJUSTMENT'), 1);
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
        pointer.x = constants.get('HALF_WINDOW_WIDTH') +
            (Math.cos(pointer2DDirection) * radiusPx);
        pointer.y = constants.get('HALF_WINDOW_HEIGHT') +
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
fetch("/resources/" + LANG + ".txt").then(function (res) {
    return res.text();
}).then(function (text) {
    t9.init(text);
    finishLoading();
});
//# sourceMappingURL=index.js.map