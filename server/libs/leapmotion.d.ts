interface LeapNoPointer {
	foundPointer: false;
	gesture?: Gesture;
	handshake: false;
}

interface LeapPointerData {
	direction: VectorArr,
	stabilizedTipPosition: VectorArr;
	gesture?: Gesture;
	foundPointer: true;
	handshake: false;
}

type WSData = LeapNoPointer|LeapPointerData;

type XYZ<T> = [T, T, T];

type VectorArr = XYZ<number>;

declare namespace LeapJS {
	export interface LoopOptions {
		/**
		 * The host name or IP address of the WebSocket server providing Leap Motion
		 * tracking data. Usually, this is the local host address: 127.0.0.1
		 */
		host?: string;
		/**
		 * The port on which the WebSocket server is listening.
		 * By default, this is port 6437
		 */
		port?: number;
		/**
		 * Set to true to enable this application to receive frames
		 * when not the foreground application
		 */
		background?: boolean;
		/**
		 * Set to true to when mounting the Leap Motion hardware
		 * to a head-mounted display
		 */
		optimizeHMD?: boolean;
		/**
		 * The type of update loop to use for processing frame data.
		 * animationFrame uses the browser animation loop (generally 60 fps),
		 * while deviceFrame runs at the Leap Motion controller frame
		 * rate (about 20 to 200 fps depending on the user’s settings
		 * and available computing power). By default, loop() uses the
		 * animationFrame update mechanism.
		 */
		frameEventName?: 'animationFrame'|'deviceFrame';
		/**
		 * False by default. This tells the controller to use all
		 * plugins included on the page.
		 */
		useAllPlugins?: boolean;
		/**
		 * Defaults to true, which means the animation frame loop runs
		 * at all times. If you set this to false, the animation loop
		 * does only runs when the Controller() object is connected
		 * to the Leap Motion service and only when a new frame of
		 * data is available. Setting loopWhileDisconnected to false
		 * can minimize your app’s use of computing resources, but
		 * may irregularly slow down or stop any animations driven by
		 * the frame loop. Added in LeapJS version 0.4.3.
		 */
		loopWhileDisconnected?: boolean;
	}

	export class Pointable {
		direction: VectorArr;
		id: string;
		length: number;
		stablizedTipPosition: VectorArr;
		timeVisible: number;
		tipPosition: VectorArr;
		tipVelocity: VectorArr;
		tool: boolean;
		touchDistance: number;
		touchZone: string;
		valid: boolean;
		width: number;
		hand(): Hand;
		toString(): string;
	}

	class GestureBase {
		duration: number;
		handIds: Array<number>;
		id: string;
		pointableIds: Array<string>;
		state: 'start'|'update'|'stop';
		type: 'swipe'|'circle'|'screenTap';
	}

	export class CircleGesture extends GestureBase {
		center: VectorArr;
		normal: VectorArr;
		progress: number;
		radius: number;
		type: 'circle';
	}

	export class SwipeGesture extends GestureBase {
		direction: VectorArr;
		position: VectorArr;
		speed: number;
		startPosition: VectorArr;
		type: 'swipe';
	}

	export class ScreenTapGesture extends GestureBase {
		direction: VectorArr;
		position: VectorArr;
		type: 'screenTap';
	}

	export type Gesture = CircleGesture|SwipeGesture|ScreenTapGesture;

	export const enum BoneType {
		Metacarpal = 0,
		'Proximal phalanx' = 1,
		'Intermediate phalanx' = 2,
		'Distal phalanx' = 3,
		forearm = 4
	}

	export interface Bone {
		basis: XYZ<VectorArr>;
		length: number;
		nextJoint: Array<number>;
		prevJoint: Array<number>;
		type: BoneType;
		width: number;
		center(): VectorArr;
		direction(): VectorArr;
		left(): boolean;
		lerp(out: VectorArr, t: number): void;
		matrix(): [
			[number, number, number, number],
			[number, number, number, number],
			[number, number, number, number],
			[number, number, number, number]
		];
	}

	export const enum FingerName {
		thumb = 0,
		index = 1,
		middle = 2,
		ring = 3,
		pinky = 4
	}

	export interface Finger {
		bones: Array<Bone>;
		carpPosition: VectorArr;
		dipPosition: VectorArr;
		distal: Bone;
		medial: Bone;
		extended: boolean;
		mcpPosition: VectorArr;
		metacarpal: Bone;
		pipPosition: VectorArr;
		proximal: Bone;
		type: FingerName;
	}

	export interface Hand {
		arm: Bone;
		confidence: number;
		direction: VectorArr;
		fingers: Array<Pointable>;
		grabStrength: number;
		id: string;
		indexFinger: Finger;
		middleFinger: Finger;
		palmNormal: VectorArr;
		palmPosition: VectorArr;
		palmVelocity: VectorArr;
		palmWidth: number;
		pinchStrength: number;
		pinky: Finger;
		pointables: Array<Pointable>;
		ringFinger: Finger;
		sphereCenter: VectorArr;
		sphereRadius: number;
		stabilizedPalmPosition: VectorArr;
		thumb: Finger;
		timeVisible: number;
		tools: Array<Pointable>;
		type: 'right'|'left';
		valid: boolean;
		finger(id: string): Pointable;
		pitch(): number;
		roll(): number;
		rotationAngle(sinceFrame: Frame, axis?: Array<number>): number;
		rotationAxis(sinceFrame: Frame): VectorArr;
		rotationMatrix(sinceFrame: Frame): [
			number, number, number, number, number, number, number, number, number
		];
		scaleFactor(sinceFrame: Frame): number;
		toString(): string;
		translation(sinceFrame: Frame): VectorArr;
		yaw(): number;

		screenPosition(): VectorArr;
	}

	export interface InteractionBox {
		center: VectorArr;
		depth: number;
		height: number;
		size: VectorArr;
		valid: boolean;
		width: number;
		denormalizePoint(normalizedPosition: VectorArr): VectorArr;
		normalizePoint(position: VectorArr, clamp: boolean): VectorArr;
		toString(): string;
	}

	export class Frame {
		new();
		constructor();
		currentFrameRate: number;
		fingers: Array<Finger>;
		gestures: Array<Gesture>;
		hands: Array<Hand>;
		id: string;
		interactionBox: InteractionBox;
		pointables: Array<Pointable>;
		timestamp: number;
		tools: Array<Pointable>;
		valid: boolean;
		dump(): string;
		finger(id: string): Finger;
		hand(id: string): Hand;
		pointable(id: string): Pointable;
		rotationAngle(sinceFrame: Frame, axis?: Array<number>): number;
		rotationAxis(sinceFrame: Frame): VectorArr;
		rotationMatrix(sinceFrame: Frame): [number, number, number,
			number, number, number, number, number, number];
		scaleFactor(sinceFrame: Frame): number;
		tool(id: string): Pointable;
		toString(): string;
		translation(sinceFrame: Frame): VectorArr;
	}

	export type ControllerEvent = 'blur'|'connect'|'deviceAttached'|
		'deviceConnected'|'deviceDisconnected'|'deviceStopped'|
		'deviceStreaming'|'disconnect'|'focus'|'frame'|
		'gesture'|'protocol'|'streamingStarted'|'streamingStopped';

	export interface Device {
		attached: boolean;
		streaming: boolean;
		id: string;
		type: 'peripheral'|'keyboard'|'laptop'|'unknown'|'unrecognized';
	}

	export interface Protocol {
		version: any;
		versionLong: any;
	}

	export class Controller {
		new(options: LoopOptions);
		constructor(options: LoopOptions);
		frameEventName: 'animationFrame'|'deviceFrame';
		connect(): Controller;
		connected(): boolean;
		disconnect(): Controller;
		frame(history?: number): Frame;
		inBrowser(): boolean;
		setBackground(state: boolean): Controller;
		setOptimizeHMD(state: boolean): Controller;
		streaming(): boolean;

		static plugin(pluginName: string, factory: (options: any) => {
			frame: Object|Function;
			hand: Object|Function;
			finger: Object|Function;
			pointable: Object|Function;
		}): Controller;
		use(pluginName: string, options?: string): Controller;
		stopUsing(pluginName: string): Controller;

		on(eventName: ControllerEvent, callback: (param1?: any, param2?: any) => void): Controller;
		on(eventName: 'animationFrame', callback: (frame: Frame) => void): Controller;
		on(eventName: 'blur', callback: () => void): Controller;
		on(eventName: 'connect', callback: () => void): Controller;
		on(eventName: 'deviceAttached', callback: (device: Device) => void): Controller;
		on(eventName: 'deviceConnected', callback: (device: Device) => void): Controller;
		on(eventName: 'deviceDisconnected', callback: (device: Device) => void): Controller;
		on(eventName: 'deviceStopped', callback: (device: Device) => void): Controller;
		on(eventName: 'deviceStreaming', callback: (device: Device) => void): Controller;
		on(eventName: 'disconnect', callback: () => void): Controller;
		on(eventName: 'focus', callback: () => void): Controller;
		on(eventName: 'frame', callback: (frame: Frame) => void): Controller;
		on(eventName: 'gesture', callback: (gesture: Gesture, frame: Frame) => void): Controller;
		on(eventName: 'frameEnd', callback: () => void): Controller;
		on(eventName: 'protocol', callback: (protocol: Protocol) => void): Controller;
		on(eventName: 'streamingStarted', callback: () => void): Controller;
		on(eventName: 'streamingStopped', callback: () => void): Controller;

		on(eventName: 'blur', callback: () => void): Controller;
	}

	export function loop(options: LoopOptions, callback: (frame: Frame) => void): Controller;
}