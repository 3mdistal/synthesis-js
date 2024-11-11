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
		const [noteName, octave] = [note.slice(0, 1).toLowerCase(), parseInt(note.slice(1))];
		const semitones = noteMap[noteName] + (octave + 1) * 12;
		return 440 * ((semitones - 69) / 12) ** 2;
	}

	playSequence(notes: string[]) {
		const frequencies = notes.map((note) => this.noteToFreq(note));
		this.#synthNode.port.postMessage({
			type: 'playSequence',
			frequencies,
			// Example envelope settings
			attack: 0.1, // seconds
			decay: 0.3 // seconds
		});
	}
}