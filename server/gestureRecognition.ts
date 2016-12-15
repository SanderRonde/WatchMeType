/// <reference path="libs/leapmotion.d.ts" />
interface Vector {
	x: number;
	y: number;
	z: number;
}

function formatVector(vector: VectorArr): Vector {
	return {
		x: vector[0],
		y: vector[1],
		z: vector[2]
	};
}

enum Cone {
	Left,
	Right,
	Top,
	Bottom,
	Forwards,
	Backwards
}

function get2DCone(vec: Vector): Cone {
	if (Math.abs(vec.x) >= Math.abs(vec.y)) {
		return (vec.x < 0 ? Cone.Left : Cone.Right);
	} else {
		return (vec.y < 0 ? Cone.Bottom : Cone.Top);
	}
}

function get3DCone(vec: Vector): Cone {
	//First get the direction in a 2D enviroment
	const cone2D = get2DCone(vec);
	const biggestFactor = (cone2D === Cone.Right || cone2D === Cone.Left ? 
		Math.abs(vec.x) : Math.abs(vec.y));

	if (Math.abs(vec.z) > biggestFactor) {
		return (vec.z < 0 ? Cone.Forwards : Cone.Backwards);
	} else {
		return cone2D;
	}
}

const trackedGestures: Array<string> = [];

function trimTrackedGestures() {
	if (trackedGestures.length > 100) {
		trackedGestures.splice(0, 50);
	}
}

export default function recognize(frame: LeapJS.Frame): Gesture {
	let returnVal = Gesture.none;
	frame.gestures.forEach((gesture) => {
		if (gesture.type === 'swipe' && trackedGestures.indexOf(gesture.id) === -1 ) {
			trackedGestures.push(gesture.id);
			trimTrackedGestures();

			const vector = formatVector(gesture.direction);
			
			//Determine the general direction the movement was in
			const cone = get3DCone(vector);

			switch (cone) {
				case Cone.Top:
					returnVal = Gesture.cycleT9Up;
					break;
				case Cone.Right:
					returnVal = Gesture.space;
					break;
				case Cone.Bottom:
					returnVal = Gesture.cycleT9Down;
					break;
				case Cone.Left:
					returnVal = Gesture.clear;
					break;
			}
		}
	});
	return returnVal;
}