// src/types/audio-worklet.d.ts
declare class AudioWorkletProcessor {
	readonly port: MessagePort;
	constructor();
	process(
		inputs: Float32Array[][],
		outputs: Float32Array[][],
		parameters: Record<string, Float32Array>
	): boolean;
}

declare class AudioParamDescriptor {
	name: string;
	defaultValue?: number;
	minValue?: number;
	maxValue?: number;
	automationRate?: 'a-rate' | 'k-rate';
}

declare function registerProcessor(name: string, processorCtor: typeof AudioWorkletProcessor): void;

declare const currentTime: number;
declare const sampleRate: number;
declare const currentFrame: number;

interface AudioWorkletGlobalScope {
	registerProcessor: typeof registerProcessor;
	currentTime: number;
	sampleRate: number;
	currentFrame: number;
}
