import type { WaveType } from './waves';
import type { FilterType } from './filters';
import { Amp } from './amp';
import { WAVE_PARAMETERS } from './waves';
import { Filter, FILTER_PARAMETERS } from './filters';

export class SynthController {
	audioContext!: AudioContext;
	#synthNode!: AudioWorkletNode;
	#filter!: Filter;
	#amp!: Amp;
	#isInitialized = false;
	#currentWaveParams: { [key: string]: number } = {};
	#currentFilterParams: { [key: string]: number } = {};

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

			// Create nodes
			this.#synthNode = new AudioWorkletNode(this.audioContext, 'simple-synth-processor');
			this.#filter = new Filter(this.audioContext);
			this.#amp = new Amp(this.audioContext);

			// Connect: Synth -> Filter -> Amp -> Speakers
			this.#synthNode.connect(this.#filter.input);
			this.#filter.connect(this.#amp.input);
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
			this.#currentWaveParams = {};
			const params = WAVE_PARAMETERS[type];
			for (const [key, param] of Object.entries(params)) {
				this.#currentWaveParams[key] = param.default;
			}
			this.#synthNode.port.postMessage({
				type: 'setWaveType',
				value: type,
				params: this.#currentWaveParams
			});
		}
	}

	setWaveParameter(name: string, value: number) {
		if (this.#synthNode && this.#isInitialized) {
			console.log(`Setting wave parameter ${name}:`, value);
			this.#currentWaveParams[name] = value;
			this.#synthNode.port.postMessage({
				type: 'setWaveParams',
				params: this.#currentWaveParams
			});
		}
	}

	setFilterType(type: FilterType) {
		if (this.#filter && this.#isInitialized) {
			console.log('Setting filter type:', type);
			this.#filter.setType(type);
			// Reset parameters to defaults for new filter type
			this.#currentFilterParams = {};
			const params = FILTER_PARAMETERS[type];
			for (const [key, param] of Object.entries(params)) {
				this.setFilterParameter(key, param.default);
			}
		}
	}

	setFilterParameter(name: string, value: number) {
		if (this.#filter && this.#isInitialized) {
			console.log(`Setting filter parameter ${name}:`, value);
			this.#currentFilterParams[name] = value;
			this.#filter.setParameter(name, value);
		}
	}

	getCurrentWaveParams(): { [key: string]: number } {
		return { ...this.#currentWaveParams };
	}

	getCurrentFilterParams(): { [key: string]: number } {
		return { ...this.#currentFilterParams };
	}
}
