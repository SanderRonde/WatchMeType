/// <reference path="libs/leapmotion.d.ts" />
import * as Leap from 'leapjs';

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

export default function recognize(frame: Leap.Frame): Gesture {
	frame.gestures.forEach((gesture) => {
		if (gesture.type === 'swipe' && trackedGestures.indexOf(gesture.id) === -1 ) {
			trackedGestures.push(gesture.id);
			trimTrackedGestures();

			const vector = formatVector(gesture.direction);
			
			//Determine the general direction the movement was in
			const cone = get3DCone(vector);

			console.log('cone', cone);
			if (cone === Cone.Left) {
				return Gesture.clear;
			} else if (cone === Cone.Bottom) {
				return Gesture.space;
			}
		}
	});
	return Gesture.none;
}