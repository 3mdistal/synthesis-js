import type { WaveType } from './waves';
import { Amp } from './amp';
import { WAVE_PARAMETERS } from './waves';

export class SynthController {
	audioContext!: AudioContext;
	#synthNode!: AudioWorkletNode;
	#amp!: Amp;
	#isInitialized = false;
	#currentParams: { [key: string]: number } = {};

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

			// Create and connect nodes
			this.#synthNode = new AudioWorkletNode(this.audioContext, 'simple-synth-processor');
			this.#amp = new Amp(this.audioContext);

			// Connect: Synth -> Amp -> Speakers
			this.#synthNode.connect(this.#amp.input);
			this.#amp.connect(this.audioContext.destination);

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
		if (this.#amp && this.#isInitialized) {
			console.log('Setting volume:', volume);
			this.#amp.setGain(volume);
		}
	}

	setWaveType(type: WaveType) {
		if (this.#synthNode && this.#isInitialized) {
			console.log('Setting wave type:', type);
			// Reset parameters to defaults for new wave type
			this.#currentParams = {};
			const params = WAVE_PARAMETERS[type];
			for (const [key, param] of Object.entries(params)) {
				this.#currentParams[key] = param.default;
			}
			this.#synthNode.port.postMessage({
				type: 'setWaveType',
				value: type,
				params: this.#currentParams
			});
		}
	}

	setWaveParameter(name: string, value: number) {
		if (this.#synthNode && this.#isInitialized) {
			console.log(`Setting parameter ${name}:`, value);
			this.#currentParams[name] = value;
			this.#synthNode.port.postMessage({
				type: 'setWaveParams',
				params: this.#currentParams
			});
		}
	}

	getCurrentParams(): { [key: string]: number } {
		return { ...this.#currentParams };
	}
}
