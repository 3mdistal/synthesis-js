export class SynthController {
	audioContext!: AudioContext;
	#synthNode!: AudioWorkletNode;
	#gainNode!: GainNode;
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
			this.#gainNode = this.audioContext.createGain();
			this.#gainNode.gain.value = 0.5;

			// Connect: Synth -> Gain -> Speakers
			this.#synthNode.connect(this.#gainNode);
			this.#gainNode.connect(this.audioContext.destination);
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
			this.#synthNode.port.postMessage({
				type: 'setFrequency',
				value: frequency
			});
		}
	}

	setVolume(volume: number) {
		if (this.#gainNode) {
			console.log('Setting volume:', volume);
			this.#gainNode.gain.value = volume;
		}
	}

	setOscType(type: 'sine' | 'square') {
		if (this.#synthNode && this.#isInitialized) {
			console.log('Setting oscillator type:', type);
			this.#synthNode.port.postMessage({
				type: 'setOscType',
				value: type
			});
		}
	}
}
