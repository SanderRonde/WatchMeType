const constantsContainer: {
	[key: string]: number;
} = {
	GLOW_ANGLE: 22.5,
	GLOW_START_RADIUS_PERCENTAGE: 50,
	GLOW_ANGLE_FACTOR: 1.1,
	KEY_PRESSED_MIN_DISTANCE: 90,
	KEY_PRESSED_MAX_ANGLE_DIFF: 10,
	FINGER_ADJUSTMENT: 1.3,
	HALF_WINDOW_WIDTH: window.innerWidth / 2,
	HALF_WINDOW_HEIGHT: window.innerHeight / 2
}

export function set(key: string, value: number): {
	key: string;
	oldVal: number;
	newVal: number;
} {
	if (!(key in constantsContainer)) {
		console.log('A constant with that name does not exist');
		return;
	}
	const oldVal = constantsContainer[key];
	constantsContainer[key] = value;
	return {
		key: key,
		oldVal: oldVal,
		newVal: value
	};
}

export function get(key: string): number {
	if (!(key in constantsContainer)) {
		throw new Error('A constant with that name does not exist');
	}

	return constantsContainer[key];
}

export function dump() {
	console.log('---Dumping constants---');
	for (let key in constantsContainer) {
		console.log(`Key: ${key}, value: ${constantsContainer[key]}`);
	}
	console.log('---End of dump---');
}

export const constants = constantsContainer;