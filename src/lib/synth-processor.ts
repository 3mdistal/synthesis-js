import { WaveGenerator } from './waves';
import type { WaveType } from './waves';

class SimpleSynthProcessor extends AudioWorkletProcessor {
	private phase = 0;
	private currentType: WaveType = 'square';

	static get parameterDescriptors() {
		return [
			{
				name: 'frequency',
				defaultValue: 440,
				minValue: 20,
				maxValue: 20000,
				automationRate: 'k-rate'
			},
			{
				name: 'gain',
				defaultValue: 0.5,
				minValue: 0,
				maxValue: 1,
				automationRate: 'k-rate'
			},
			{
				name: 'waveTypeIndex',
				defaultValue: 0, // 0: sine, 1: square, 2: saw
				minValue: 0,
				maxValue: 2,
				automationRate: 'k-rate'
			}
		];
	}

	constructor() {
		super();
		this.port.onmessage = (e: MessageEvent) => {
			if (e.data.type === 'setWaveType') {
				this.currentType = e.data.value;
			}
		};
	}

	process(
		_inputs: Float32Array[][],
		outputs: Float32Array[][],
		parameters: Record<string, Float32Array>
	): boolean {
		const output = outputs[0];
		const frequency = parameters.frequency[0];
		const gain = parameters.gain[0];

		// Calculate phase increment
		const dt = frequency / sampleRate;

		// Generate audio for each output channel
		for (let channel = 0; channel < output.length; ++channel) {
			const outputChannel = output[channel];

			// Fill the output buffer with samples
			for (let i = 0; i < outputChannel.length; ++i) {
				// Generate waveform using our library
				const sample = WaveGenerator.generate(this.currentType, this.phase, dt);

				// Apply gain
				outputChannel[i] = sample * gain;

				// Advance and wrap phase
				this.phase += dt;
				if (this.phase >= 1.0) {
					this.phase -= 1.0;
				}
			}
		}

		return true;
	}
}

registerProcessor('simple-synth-processor', SimpleSynthProcessor);
