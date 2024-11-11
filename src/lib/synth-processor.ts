class SimpleSynthProcessor extends AudioWorkletProcessor {
	frequencies: number[];
	attack: number;
	decay: number;
	phase: number;
	noteIndex: number;
	isPlaying: boolean;
	envelope: number;
	noteStartTime: number;

	constructor() {
		super();
		this.phase = 0;
		this.noteIndex = 0;
		this.isPlaying = false;
		this.envelope = 0;
		this.noteStartTime = 0;
		this.frequencies = [];
		this.attack = 0.1;
		this.decay = 0.3;

		this.port.onmessage = (e: MessageEvent) => {
			if (e.data.type === 'playSequence') {
				this.frequencies = e.data.frequencies;
				this.attack = e.data.attack;
				this.decay = e.data.decay;
				this.noteIndex = 0;
				this.isPlaying = true;
				this.phase = 0;
				this.noteStartTime = this.getCurrentTime();
				this.envelope = 0;
			}
		};
	}

	getCurrentTime(): number {
		return currentFrame / sampleRate;
	}

	calculateEnvelope(time: number): number {
		const noteTime = time - this.noteStartTime;

		if (noteTime < 0) {
			// Protection against negative time
			return 0;
		}
		if (noteTime < this.attack) {
			return noteTime / this.attack; // Linear ramp up
		} else if (noteTime < this.attack + this.decay) {
			return 1 - (noteTime - this.attack) / this.decay; // Linear ramp down
		}
		return 0;
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
		const output = outputs[0];
		const currentTime = this.getCurrentTime();

		if (this.isPlaying) {
			const frequency = this.frequencies[this.noteIndex];
			const newEnvelope = this.calculateEnvelope(currentTime);

			// Generate audio first
			for (let channel = 0; channel < output.length; ++channel) {
				const outputChannel = output[channel];
				for (let i = 0; i < outputChannel.length; ++i) {
					outputChannel[i] = Math.sin(2.0 * Math.PI * frequency * this.phase) * newEnvelope;
					this.phase += 1 / sampleRate;
				}
			}

			// Update envelope and check for note completion after generating audio
			this.envelope = newEnvelope;
			if (this.envelope <= 0 && currentTime > this.noteStartTime + this.attack + this.decay) {
				this.noteIndex++;
				if (this.noteIndex >= this.frequencies.length) {
					this.isPlaying = false;
					return true;
				}
				this.noteStartTime = currentTime;
				this.phase = 0;
			}
		}

		return true;
	}
}

registerProcessor('simple-synth-processor', SimpleSynthProcessor);
