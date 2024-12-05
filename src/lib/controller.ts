import type { WaveType } from './waves';

export class SynthController {
	audioContext!: AudioContext;
	#synthNode!: AudioWorkletNode;
	#isInitialized = false;

	async init() {
		if (!this.#isInitialized) {
			try {
				console.log('Initializing audio context...');
				this.audioContext = new AudioContext();
				await this.setup();
				this.#isInitialized = true;
				console.log('Audio context initialized successfully');
			} catch (error) {
				console.error('Failed to initialize synth:', error);
				throw error;
			}
		}
		console.log('Resuming audio context...');
		await this.audioContext.resume();
		console.log('Audio context state:', this.audioContext.state);
	}

	async stop() {
		if (this.audioContext) {
			console.log('Suspending audio context...');
			await this.audioContext.suspend();
			console.log('Audio context state:', this.audioContext.state);
		}
	}

	private async setup() {
		try {
			console.log('Setting up audio nodes...');
			await this.audioContext.audioWorklet.addModule('/synth-processor.js');
			this.#synthNode = new AudioWorkletNode(this.audioContext, 'simple-synth-processor');
			this.#synthNode.connect(this.audioContext.destination);
			console.log('Audio nodes set up successfully');

			// Add error handler for AudioWorklet
			this.#synthNode.onprocessorerror = (event) => {
				console.error('AudioWorklet processor error:', event);
			};
		} catch (error) {
			console.error('Failed to setup AudioWorklet:', error);
			throw error;
		}
	}

	setFrequency(frequency: number) {
		if (this.#synthNode && this.#isInitialized) {
			console.log('Setting frequency:', frequency);
			const param = (this.#synthNode.parameters as Map<string, AudioParam>).get('frequency');
			if (param) param.setValueAtTime(frequency, this.audioContext.currentTime);
		}
	}

	setVolume(volume: number) {
		if (this.#synthNode && this.#isInitialized) {
			console.log('Setting volume:', volume);
			const param = (this.#synthNode.parameters as Map<string, AudioParam>).get('gain');
			if (param) param.setValueAtTime(volume, this.audioContext.currentTime);
		}
	}

	setWaveType(type: WaveType) {
		if (this.#synthNode && this.#isInitialized) {
			console.log('Setting wave type:', type);
			this.#synthNode.port.postMessage({
				type: 'setWaveType',
				value: type
			});
		}
	}
}
