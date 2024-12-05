export class Amp {
	#gainNode: GainNode;

	constructor(context: AudioContext) {
		this.#gainNode = context.createGain();
		this.#gainNode.gain.value = 0.5; // Initial gain
	}

	connect(destination: AudioNode): void {
		this.#gainNode.connect(destination);
	}

	connectInput(source: AudioNode): void {
		source.connect(this.#gainNode);
	}

	setGain(value: number, timeConstant = 0.01): void {
		// Use exponential ramping for more natural volume changes
		this.#gainNode.gain.setTargetAtTime(value, this.#gainNode.context.currentTime, timeConstant);
	}

	get input(): AudioNode {
		return this.#gainNode;
	}

	get output(): AudioNode {
		return this.#gainNode;
	}
}
