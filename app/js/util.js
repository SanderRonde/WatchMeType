/// <reference path="../../typings/index.d.ts" />
"use strict";
var fetchPolyfill = require('./libs/fetch.js');
function utilFetch(url, init) {
    if ('fetch' in window) {
        return fetch(url, init);
    }
    return fetchPolyfill(url, init);
}
exports.fetch = utilFetch;
/**
 * Converts an object to an array of its members
 *
 * @param {Object} obj - The object to array-ify
 *
 * @return {any[]} Its members
 */
function objToArr(obj) {
    return Object.getOwnPropertyNames(obj).map(function (index) {
        return obj[index];
    });
}
exports.objToArr = objToArr;
//# sourceMappingURL=util.js.map