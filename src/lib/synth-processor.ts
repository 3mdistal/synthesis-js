class SimpleSynthProcessor extends AudioWorkletProcessor {
	frequency: number;
	targetFrequency: number;
	phase: number;
	type: 'sine' | 'square';
	smoothingFactor: number;

	constructor() {
		super();
		this.frequency = 440;
		this.targetFrequency = 440;
		this.phase = 0;
		this.type = 'square';
		this.smoothingFactor = 0.05;

		this.port.onmessage = (e: MessageEvent) => {
			if (e.data.type === 'setFrequency') {
				console.log('Received frequency:', e.data.value);
				this.targetFrequency = e.data.value;
			} else if (e.data.type === 'setOscType') {
				this.type = e.data.value;
			}
		};
	}

	// PolyBLEP anti-aliasing for square wave
	polyBlep(t: number, dt: number): number {
		// t = phase, dt = frequency/sampleRate
		if (t < dt) {
			t = t / dt;
			return t + t - t * t - 1.0;
		} else if (t > 1.0 - dt) {
			t = (t - 1.0) / dt;
			return t * t + t + t + 1.0;
		}
		return 0.0;
	}

	process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
		const output = outputs[0];

		// Smooth frequency changes
		this.frequency += (this.targetFrequency - this.frequency) * this.smoothingFactor;

		// Calculate phase increment
		const dt = this.frequency / sampleRate;

		// Generate audio for each output channel
		for (let channel = 0; channel < output.length; ++channel) {
			const outputChannel = output[channel];

			// Fill the output buffer with samples
			for (let i = 0; i < outputChannel.length; ++i) {
				const t = this.phase;

				// Generate waveform
				if (this.type === 'sine') {
					outputChannel[i] = Math.sin(2.0 * Math.PI * t);
				} else {
					// Anti-aliased square wave using PolyBLEP
					let square = t < 0.5 ? 1 : -1;
					square -= this.polyBlep(t, dt); // First edge
					square += this.polyBlep((t + 0.5) % 1.0, dt); // Second edge
					outputChannel[i] = square * 0.5; // Reduce amplitude to prevent clipping
				}

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
