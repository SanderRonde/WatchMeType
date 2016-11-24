"use strict";
var fetchPolyfill = require('./libs/fetch.js');
function utilFetch(url, init) {
    if ('fetch' in window) {
        return fetch(url, init);
    }
    return fetchPolyfill(url, init);
}
exports.fetch = utilFetch;
function objToArr(obj) {
    return Object.getOwnPropertyNames(obj).map(function (index) {
        return obj[index];
    });
}
exports.objToArr = objToArr;
//# sourceMappingURL=util.js.map