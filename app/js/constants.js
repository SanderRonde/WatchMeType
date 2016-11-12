"use strict";
var constantsContainer = {
    GLOW_ANGLE: 22.5,
    GLOW_START_RADIUS_PERCENTAGE: 50,
    GLOW_ANGLE_FACTOR: 1.1,
    KEY_PRESSED_MIN_DISTANCE: 90,
    KEY_PRESSED_MAX_ANGLE_DIFF: 10,
    FINGER_ADJUSTMENT: 1.3,
    HALF_WINDOW_WIDTH: window.innerWidth / 2,
    HALF_WINDOW_HEIGHT: window.innerHeight / 2
};
function set(key, value) {
    if (!(key in constantsContainer)) {
        console.log('A constant with that name does not exist');
        return;
    }
    var oldVal = constantsContainer[key];
    constantsContainer[key] = value;
    return {
        key: key,
        oldVal: oldVal,
        newVal: value
    };
}
exports.set = set;
function get(key) {
    if (!(key in constantsContainer)) {
        throw new Error('A constant with that name does not exist');
    }
    return constantsContainer[key];
}
exports.get = get;
function dump() {
    console.log('---Dumping constants---');
    for (var key in constantsContainer) {
        console.log("Key: " + key + ", value: " + constantsContainer[key]);
    }
    console.log('---End of dump---');
}
exports.dump = dump;
exports.constants = constantsContainer;
//# sourceMappingURL=constants.js.map