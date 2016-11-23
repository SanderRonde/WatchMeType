/// <reference path="../../typings/index.d.ts" />

const fetchPolyfill = require('./libs/fetch.js'); 

function utilFetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
	if ('fetch' in window) {
		return fetch(url, init);
	}
	return fetchPolyfill(url, init);
}

export {
	utilFetch as fetch
}