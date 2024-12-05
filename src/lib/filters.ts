export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

export interface FilterParameter {
	name: string;
	min: number;
	max: number;
	default: number;
	step: number;
}

export const FILTER_PARAMETERS: Record<FilterType, Record<string, FilterParameter>> = {
	lowpass: {
		cutoff: {
			name: 'Cutoff',
			min: 20,
			max: 20000,
			default: 1000,
			step: 1
		},
		resonance: {
			name: 'Resonance',
			min: 0,
			max: 20,
			default: 1,
			step: 0.1
		}
	},
	highpass: {
		cutoff: {
			name: 'Cutoff',
			min: 20,
			max: 20000,
			default: 1000,
			step: 1
		},
		resonance: {
			name: 'Resonance',
			min: 0,
			max: 20,
			default: 1,
			step: 0.1
		}
	},
	bandpass: {
		frequency: {
			name: 'Center Frequency',
			min: 20,
			max: 20000,
			default: 1000,
			step: 1
		},
		Q: {
			name: 'Q Factor',
			min: 0.1,
			max: 40,
			default: 1,
			step: 0.1
		}
	},
	notch: {
		frequency: {
			name: 'Center Frequency',
			min: 20,
			max: 20000,
			default: 1000,
			step: 1
		},
		Q: {
			name: 'Q Factor',
			min: 0.1,
			max: 40,
			default: 1,
			step: 0.1
		}
	}
};

// State-Variable Filter implementation
export class Filter {
	private context: AudioContext;
	private filter: BiquadFilterNode;

	constructor(context: AudioContext, type: FilterType = 'lowpass') {
		this.context = context;
		this.filter = context.createBiquadFilter();
		this.filter.type = type;
		this.filter.frequency.value = FILTER_PARAMETERS[type].cutoff?.default || 1000;
		this.filter.Q.value = FILTER_PARAMETERS[type].resonance?.default || 1;
	}

	connect(destination: AudioNode): void {
		this.filter.connect(destination);
	}

	connectInput(source: AudioNode): void {
		source.connect(this.filter);
	}

	setType(type: FilterType): void {
		this.filter.type = type;
	}

	setParameter(name: string, value: number): void {
		switch (name) {
			case 'cutoff':
			case 'frequency':
				this.filter.frequency.setTargetAtTime(value, this.context.currentTime, 0.01);
				break;
			case 'resonance':
			case 'Q':
				this.filter.Q.setTargetAtTime(value, this.context.currentTime, 0.01);
				break;
		}
	}

	get input(): AudioNode {
		return this.filter;
	}

	get output(): AudioNode {
		return this.filter;
	}
}

export default Filter;
