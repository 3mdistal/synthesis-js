// Anti-aliasing helper functions
export function polyBlep(t: number, dt: number): number {
	if (t < dt) {
		t = t / dt;
		return t + t - t * t - 1.0;
	} else if (t > 1.0 - dt) {
		t = (t - 1.0) / dt;
		return t * t + t + t + 1.0;
	}
	return 0.0;
}

export type WaveType =
	| 'sine'
	| 'square'
	| 'saw'
	| 'triangle'
	| 'pulse'
	| 'noise'
	| 'sine-square'
	| 'double-sine'
	| 'fold-sine';

export interface WaveParameter {
	name: string;
	min: number;
	max: number;
	default: number;
	step: number;
}

export const WAVE_PARAMETERS: Record<WaveType, Record<string, WaveParameter>> = {
	sine: {},
	square: {},
	saw: {},
	triangle: {},
	pulse: {
		pulseWidth: {
			name: 'Pulse Width',
			min: 0.1,
			max: 0.9,
			default: 0.5,
			step: 0.01
		}
	},
	noise: {},
	'sine-square': {
		morph: {
			name: 'Sine → Square',
			min: 0,
			max: 1,
			default: 0.5,
			step: 0.01
		}
	},
	'double-sine': {
		mix: {
			name: 'Octave Mix',
			min: 0,
			max: 1,
			default: 0.5,
			step: 0.01
		}
	},
	'fold-sine': {
		foldAmount: {
			name: 'Fold Amount',
			min: 1,
			max: 10,
			default: 1,
			step: 0.1
		}
	}
};

export class WaveGenerator {
	// Store some state for noise generation
	private static noiseBuffer: number[] = new Array(1024).fill(0).map(() => Math.random() * 2 - 1);
	private static noiseIndex = 0;

	static generate(
		type: WaveType,
		phase: number,
		dt: number,
		params: { [key: string]: number } = {}
	): number {
		switch (type) {
			case 'sine':
				return WaveGenerator.sine(phase);
			case 'square':
				return WaveGenerator.square(phase, dt);
			case 'saw':
				return WaveGenerator.saw(phase, dt);
			case 'triangle':
				return WaveGenerator.triangle(phase);
			case 'pulse':
				return WaveGenerator.pulse(phase, dt, params.pulseWidth ?? 0.5);
			case 'noise':
				return WaveGenerator.noise();
			case 'sine-square':
				return WaveGenerator.sineSquare(phase, params.morph ?? 0.5);
			case 'double-sine':
				return WaveGenerator.doubleSine(phase, params.mix ?? 0.5);
			case 'fold-sine':
				return WaveGenerator.foldSine(phase, params.foldAmount ?? 1.0);
			default:
				return 0;
		}
	}

	private static sine(phase: number): number {
		return Math.sin(2.0 * Math.PI * phase);
	}

	private static square(phase: number, dt: number): number {
		// Anti-aliased square wave
		let square = phase < 0.5 ? 1 : -1;
		square -= polyBlep(phase, dt);
		square += polyBlep((phase + 0.5) % 1.0, dt);
		return square * 0.5;
	}

	private static saw(phase: number, dt: number): number {
		// Anti-aliased sawtooth wave
		let saw = 2.0 * phase - 1.0;
		saw -= polyBlep(phase, dt);
		return saw * 0.5;
	}

	private static triangle(phase: number): number {
		// Triangle wave (naturally anti-aliased due to lack of sharp transitions)
		return 2.0 * Math.abs(2.0 * (phase - Math.floor(phase + 0.5))) - 1.0;
	}

	private static pulse(phase: number, dt: number, pulseWidth: number): number {
		// Anti-aliased pulse wave with variable pulse width
		let pulse = phase < pulseWidth ? 1 : -1;
		pulse -= polyBlep(phase, dt);
		pulse += polyBlep((phase + (1.0 - pulseWidth)) % 1.0, dt);
		return pulse * 0.5;
	}

	private static noise(): number {
		// Sample and hold noise, changes every 1/100th of a second
		if (++this.noiseIndex >= 100) {
			this.noiseIndex = 0;
			this.noiseBuffer[Math.floor(Math.random() * this.noiseBuffer.length)] = Math.random() * 2 - 1;
		}
		return this.noiseBuffer[Math.floor(Math.random() * this.noiseBuffer.length)] * 0.5;
	}

	private static sineSquare(phase: number, morph: number): number {
		// Continuous morph between sine and square using a power function
		const sine = Math.sin(2.0 * Math.PI * phase);
		return Math.sign(sine) * Math.pow(Math.abs(sine), 1 - morph) * 0.5;
	}

	private static doubleSine(phase: number, mix: number): number {
		// Mix between two sine waves an octave apart
		const fundamental = Math.sin(2.0 * Math.PI * phase);
		const octave = Math.sin(4.0 * Math.PI * phase);
		return (fundamental * (1 - mix) + octave * mix) * 0.5;
	}

	private static foldSine(phase: number, foldAmount: number): number {
		// Sine wave with wave folding (analog-style distortion)
		const sine = Math.sin(2.0 * Math.PI * phase);
		const folded = Math.sin(2.0 * Math.PI * phase * foldAmount);
		return (sine + folded) * 0.25;
	}
}

export default WaveGenerator;
