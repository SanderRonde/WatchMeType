/// <reference path="../../typings/index.d.ts" />

const fetchPolyfill = require('./libs/fetch.js'); 

function utilFetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
	if ('fetch' in window) {
		return fetch(url, init);
	}
	return fetchPolyfill(url, init);
}

/**
 * Converts an object to an array of its members
 * 
 * @param {Object} obj - The object to array-ify
 * 
 * @return {any[]} Its members
 */
export function objToArr<T>(obj: {
	[key: string]: T;
}): Array<T> {
	return Object.getOwnPropertyNames(obj).map((index) => {
		return obj[index];
	});
}


export {
	utilFetch as fetch
}