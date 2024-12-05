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

export type WaveType = 'sine' | 'square' | 'saw';

export class WaveGenerator {
	static generate(type: WaveType, phase: number, dt: number): number {
		switch (type) {
			case 'sine':
				return WaveGenerator.sine(phase);
			case 'square':
				return WaveGenerator.square(phase, dt);
			case 'saw':
				return WaveGenerator.saw(phase, dt);
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
}

export default WaveGenerator;
