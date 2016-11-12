"use strict";
function formatVector(vector) {
    return {
        x: vector[0],
        y: vector[1],
        z: vector[2]
    };
}
var Cone;
(function (Cone) {
    Cone[Cone["Left"] = 0] = "Left";
    Cone[Cone["Right"] = 1] = "Right";
    Cone[Cone["Top"] = 2] = "Top";
    Cone[Cone["Bottom"] = 3] = "Bottom";
    Cone[Cone["Forwards"] = 4] = "Forwards";
    Cone[Cone["Backwards"] = 5] = "Backwards";
})(Cone || (Cone = {}));
function get2DCone(vec) {
    if (Math.abs(vec.x) >= Math.abs(vec.y)) {
        return (vec.x < 0 ? Cone.Left : Cone.Right);
    }
    else {
        return (vec.y < 0 ? Cone.Bottom : Cone.Top);
    }
}
function get3DCone(vec) {
    var cone2D = get2DCone(vec);
    var biggestFactor = (cone2D === Cone.Right || cone2D === Cone.Left ?
        Math.abs(vec.x) : Math.abs(vec.y));
    if (Math.abs(vec.z) > biggestFactor) {
        return (vec.z < 0 ? Cone.Forwards : Cone.Backwards);
    }
    else {
        return cone2D;
    }
}
var trackedGestures = [];
function trimTrackedGestures() {
    if (trackedGestures.length > 100) {
        trackedGestures.splice(0, 50);
    }
}
function recognize(frame) {
    frame.gestures.forEach(function (gesture) {
        if (gesture.type === 'swipe' && trackedGestures.indexOf(gesture.id) === -1) {
            trackedGestures.push(gesture.id);
            trimTrackedGestures();
            var vector = formatVector(gesture.direction);
            var cone = get3DCone(vector);
            console.log('cone', cone);
            if (cone === Cone.Left) {
                return 1;
            }
            else if (cone === Cone.Bottom) {
                return 2;
            }
        }
    });
    return 0;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = recognize;
//# sourceMappingURL=gestureRecognition.js.map