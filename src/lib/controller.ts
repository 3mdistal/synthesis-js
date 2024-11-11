export class SynthController {
	audioContext!: AudioContext;
	#synthNode!: AudioWorkletNode;

	async init() {
		this.audioContext = new AudioContext();
		await this.setup();
	}

	async setup() {
		await this.audioContext.audioWorklet.addModule('/synth-processor.js');
		this.#synthNode = new AudioWorkletNode(this.audioContext, 'simple-synth-processor');
		this.#synthNode.connect(this.audioContext.destination);
	}

	noteToFreq(note: string) {
		const noteMap: { [key: string]: number } = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

		// Extract note, accidental, and octave
		const match = note.match(/^([a-g])(#|b)?(\d+)$/i);
		if (!match) throw new Error('Invalid note format');

		const [, noteName, accidental, octave] = match;
		let semitones = noteMap[noteName.toLowerCase()];

		// Adjust for sharp or flat
		if (accidental === '#') semitones += 1;
		if (accidental === 'b') semitones -= 1;

		semitones += (parseInt(octave) + 1) * 12;
		return 440 * Math.pow(2, (semitones - 69) / 12);
	}

	playSequence(notes: string[]) {
		const frequencies = notes.map((note) => this.noteToFreq(note));
		this.#synthNode.port.postMessage({
			type: 'playSequence',
			frequencies,
			attack: 0.05,
			decay: 0.1
		});
	}
}
