"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var components = require('./components');
var DEBUG = window.location.hash === '#d';
var GLOW_ANGLE = 22.5;
var GLOW_START_RADIUS_PERCENTAGE = 50;
var GLOW_ANGLE_FACTOR = 1.1;
var KEY_PRESSED_MIN_DISTANCE = 90;
var KEY_PRESSED_MAX_ANGLE_DIFF = 10;
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
                    comm.fireMainFaceListener(0, listenerData.element.symbol);
                }
            });
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
    comm: comm
}), document.getElementById('mainContainer'));
function updatePointerPos() {
    if (lastPointerPos.x !== pointer.x || lastPointerPos.y !== pointer.y) {
        comm.fireSymbolListeners(pointer);
        lastPointerPos.x = pointer.x;
        lastPointerPos.y = pointer.y;
    }
    window.requestAnimationFrame(updatePointerPos);
}
window.requestAnimationFrame(updatePointerPos);
if (DEBUG) {
    window.onmousemove = function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
    };
}
//# sourceMappingURL=index.js.map