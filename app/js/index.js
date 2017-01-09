/// <reference path="../../typings/index.d.ts" />
/// <reference path="./defs.d.ts" />
"use strict";
var React = require("react");
var ReactDOM = require("react-dom");
var components = require("./components");
var util = require("./util");
var KEY_PRESSED_MIN_DISTANCE = 90;
var KEY_PRESSED_MAX_ANGLE_DIFF = 10;
var FINGER_ADJUSTMENT = 1.3;
var VMIN = Math.min(window.innerWidth, window.innerHeight) / 100;
var HALF_WINDOW_WIDTH = window.innerWidth / 2;
var HALF_WINDOW_HEIGHT = window.innerHeight / 2;
var CHOOSE_SYMBOL_ACTIVATION = 25;
var CANCEL_SPECIFIC_SYMBOL_MODE_ANGLE = 40;
var t9 = require('./libs/t9.js');
var hashSplit = window.location.hash.slice(1).split('-').map(function (option) {
    return option.toLowerCase();
});
var DEBUG = hashSplit.indexOf('d') > -1;
var LANG = (hashSplit.indexOf('nl') > -1 ||
    hashSplit.indexOf('dutch') > -1) ? 'dutch' : 'english';
var SHOWDOT = hashSplit.indexOf('dot') > -1;
var SHOWTUTORIAL = hashSplit.indexOf('showtutorial') > -1;
if (!SHOWDOT) {
    document.getElementById('pointerDot').style.display = 'none';
}
if (DEBUG) {
    console.log("Using debug mode");
}
var SYMBOL_RADIUS = Math.min(window.innerWidth, window.innerHeight * 0.98) * 0.4;
var MAX_FINGER_RADIUS = Math.min(window.innerWidth, window.innerHeight * 0.98) *
    (0.41 + (CHOOSE_SYMBOL_ACTIVATION / 100));
var pressingKey = -1;
var isLoading = true;
var waitForReset = false;
var selectingT9LetterAngle = -1;
var tutorialVisible = SHOWTUTORIAL;
if (!SHOWTUTORIAL) {
    document.querySelector('#tutorial').classList.add('hidden');
}
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
function isHoveringOver(area, pos) {
    if (!area) {
        return false;
    }
    return (Math.pow(pos.x - area.x, 2) + Math.pow(pos.y - area.y, 2) < Math.pow(area.radius, 2));
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
        if (selectingT9LetterAngle !== -1) {
            //Cancel if needed
            if (!waitForReset && radius >= SYMBOL_RADIUS &&
                Math.abs(gestureAngle - selectingT9LetterAngle) <=
                    CANCEL_SPECIFIC_SYMBOL_MODE_ANGLE) {
                //Cancel this mode
                chooseSymbolOverlay.hide();
                selectingT9LetterAngle = -1;
                waitForReset = true;
                return;
            }
            else {
                //Check if the buttons are being hovered over
                chooseSymbolOverlay.slices.forEach(function (slice) {
                    if (!slice || !slice.child) {
                        return;
                    }
                    if (isHoveringOver(slice.child.area, pos)) {
                        slice.child.symbolCont.classList.add('toggled');
                        comm.fireMainFaceListener(4 /* specificKeyPressed */, slice.child.symbol.symbol);
                        chooseSymbolOverlay.hide();
                        selectingT9LetterAngle = -1;
                        waitForReset = true;
                    }
                });
            }
        }
        if (waitForReset) {
            if (radius < SYMBOL_RADIUS * 0.5) {
                waitForReset = false;
            }
            else {
                return;
            }
        }
        if (radius >= SYMBOL_RADIUS) {
            var maxGlowIntensity = getGlowIntensity(SYMBOL_RADIUS, radius);
            gestureAngle = (gestureAngle + (360 / 26)) % 360;
            if (maxGlowIntensity >= KEY_PRESSED_MIN_DISTANCE * 0.8) {
                //Some area was toggled, find out which one
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
                var displacedPixels = radius - SYMBOL_RADIUS;
                if (displacedPixels > CHOOSE_SYMBOL_ACTIVATION * VMIN) {
                    //Enter choose-symbol mode
                    enterChooseSymbolMode(comm._symbolListeners[toggledIndex].element
                        .children.map(function (slice) {
                        return slice.child.symbol.symbol;
                    }), comm._symbolListeners[toggledIndex].angle);
                    comm._symbolListeners[toggledIndex].listener(1 /* fired */, 0);
                    comm._faceListeners.forEach(function (faceListener) {
                        faceListener(3 /* resetSlices */);
                    });
                    pressingKey = -1;
                }
                else {
                    comm._symbolListeners[toggledIndex].listener(1 /* fired */, displacedPixels);
                    pressingKey = comm._symbolListeners[toggledIndex].element
                        .props.data.index + 1;
                }
            }
        }
        else if (pressingKey !== -1) {
            comm.fireMainFaceListener(2 /* T9KeyPressed */, pressingKey);
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
            case 0 /* send */:
                alert("Sent message \"" + data + "\"");
                break;
        }
    }
};
document.body.addEventListener('keydown', function (e) {
    if (tutorialVisible) {
        goToNextTutorialSlide();
    }
    else {
        comm.fireMainFaceListener(5 /* watchFaceCommand */, e.key);
    }
});
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
            pointerDot.style.top = pointer.y - 7.5 + "px";
            pointerDot.style.left = pointer.x - 7.5 + "px";
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
    //Max from the center is bending your finger about 30 degrees,
    var currentRatio = Math.abs(vector[2]) /
        (Math.abs(vector[0]) + Math.abs(vector[1]));
    return Math.min((1 / currentRatio) * FINGER_ADJUSTMENT, 1);
}
function getPointer2DDirection(vector) {
    var angle = Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
    return angle;
}
function handleGestures(data) {
    if (data.gesture === 0 /* none */) {
        return false;
    }
    comm.fireMainFaceListener(1 /* gesture */, data.gesture);
}
websocket.onmessage = function (event) {
    var stringifiedData = event.data;
    var data = JSON.parse(stringifiedData);
    var spottedGesture = handleGestures(data);
    if (data.foundPointer) {
        //Get the amount of degrees that the finger is moving to the outside
        var pointer2DDirection = -getPointer2DDirection(data.direction) * (Math.PI / 180);
        var radiusPercentage = getPointerRadius(data.direction, pointer2DDirection);
        var radiusPx = radiusPercentage * MAX_FINGER_RADIUS;
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
var currentTutorialSlide = 0;
var exitEl = document.querySelector('#closeTutorialButton');
var carrouselEl = document.querySelector('#tutorialContents');
function goToTutorialSlide(index) {
    index = Math.min(index, 5);
    carrouselEl.style.transform = "translateX(calc(-60vmin * " + index + "))";
    dots[currentTutorialSlide].classList.remove('active');
    dots[index].classList.add('active');
    currentTutorialSlide = index;
    exitEl.classList[index === 5 ? 'add' : 'remove']('visible');
}
function goToNextTutorialSlide() {
    goToTutorialSlide(currentTutorialSlide + 1);
}
var dots = Array.prototype.slice.call(document.querySelectorAll('.tutorialButton'))
    .map(function (dot) {
    dot.addEventListener('click', function () {
        goToTutorialSlide(~~dot.getAttribute('data-index'));
    });
    return dot;
});
exitEl.addEventListener('click', function () {
    document.querySelector('#tutorial').classList.add('hidden');
    tutorialVisible = false;
});
//# sourceMappingURL=index.js.map