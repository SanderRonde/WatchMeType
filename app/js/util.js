"use strict";
var fetchPolyfill = require('./libs/fetch.js');
function utilFetch(url, init) {
    if ('fetch' in window) {
        return fetch(url, init);
    }
    return fetchPolyfill(url, init);
}
exports.fetch = utilFetch;
//# sourceMappingURL=util.js.map