"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var components = require('./components');
var t9 = require('./t9.js');
var hashSplit = window.location.hash.slice(1).split('-');
var DEBUG = hashSplit.indexOf('d') > -1;
var USET9 = hashSplit.indexOf('t9') > -1;
var LANG = hashSplit.indexOf('nl') > -1 ? 'dutch' : 'english';
if (DEBUG) {
    console.log("Using debug mode");
}
console.log(DEBUG, USET9);
var GLOW_ANGLE = 22.5;
var GLOW_START_RADIUS_PERCENTAGE = 50;
var GLOW_ANGLE_FACTOR = 1.1;
var KEY_PRESSED_MIN_DISTANCE = 90;
var KEY_PRESSED_MAX_ANGLE_DIFF = 10;
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
    return Math.abs(listenerAngle - listenerAngle) <= GLOW_ANGLE;
}
function radiusFromCenter(pos) {
    var center = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };
    return Math.sqrt(Math.pow(center.x - pos.x, 2) + Math.pow(center.y - pos.y, 2));
}
function getGlowIntensity(symbolRadius, radius) {
    return Math.pow((Math.min(radius / symbolRadius, 1) * 100), 2) / 100;
}
function getAngleDifference(angle1, angle2) {
    if (angle1 >= 360 - GLOW_ANGLE && angle2 <= GLOW_ANGLE) {
        angle2 += 360;
    }
    else if (angle2 >= 360 - GLOW_ANGLE && angle1 <= GLOW_ANGLE) {
        angle1 += 360;
    }
    return Math.abs(angle1 - angle2);
}
function getAngleGlowIntensity(max, difference) {
    return (((GLOW_ANGLE - difference * GLOW_ANGLE_FACTOR) * max) / GLOW_ANGLE) || 0;
}
function keyPressed(glowIntensity, angleDifference) {
    return cursorReset && glowIntensity >= KEY_PRESSED_MIN_DISTANCE &&
        angleDifference <= KEY_PRESSED_MAX_ANGLE_DIFF;
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
        var gestureAngle = Math.atan2(pos.y - window.innerHeight / 2, pos.x - window.innerWidth / 2) * 180 / Math.PI;
        if (gestureAngle < 0) {
            gestureAngle = 360 + gestureAngle;
        }
        gestureAngle += 90;
        gestureAngle = gestureAngle % 360;
        var symbolRadius = Math.min(window.innerWidth, window.innerHeight * 0.98) *
            0.45;
        var radius = radiusFromCenter(pos);
        if (radius >= symbolRadius * (GLOW_START_RADIUS_PERCENTAGE / 100)) {
            var maxGlowIntensity_1 = getGlowIntensity(symbolRadius, radius);
            if (USET9) {
                gestureAngle += (360 / 26);
                if (maxGlowIntensity_1 >= KEY_PRESSED_MIN_DISTANCE * 0.8 && cursorReset) {
                    var toggledIndex = comm._symbolListeners.length - 1;
                    var lastSlice = 0;
                    for (var i = 0; i < comm._symbolListeners.length; i++) {
                        if (comm._symbolListeners[i].element.elName === 'T9Slice') {
                            if (gestureAngle < comm._symbolListeners[i].angle) {
                                toggledIndex = lastSlice;
                                break;
                            }
                            lastSlice = i;
                        }
                    }
                    comm._symbolListeners[toggledIndex].listener(1);
                    cursorReset = false;
                    comm.fireMainFaceListener(2, comm._symbolListeners[toggledIndex].element
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
function updatePointerPos() {
    if (lastPointerPos.x !== pointer.x || lastPointerPos.y !== pointer.y) {
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
var websocket = new WebSocket('ws://localhost:1234');
websocket.onmessage = function (event) {
    var data = event.data;
    pointer.x = data.x;
    pointer.y = data.y;
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