<script lang="ts">
	import { SynthController } from '$lib/controller';
	import type { WaveType, WaveParameter } from '$lib/waves';
	import type { FilterType, FilterParameter } from '$lib/filters';
	import { WAVE_PARAMETERS } from '$lib/waves';
	import { FILTER_PARAMETERS } from '$lib/filters';
	import { onMount } from 'svelte';

	const synth = new SynthController();
	let frequency = 440;
	let volume = 0.5;
	let isPlaying = false;
	let error = '';
	let waveType: WaveType = 'square';
	let filterType: FilterType = 'lowpass';
	let currentWaveParams: { [key: string]: number } = {};
	let currentFilterParams: { [key: string]: number } = {};

	const waveTypes: WaveType[] = Object.keys(WAVE_PARAMETERS) as WaveType[];
	const filterTypes: FilterType[] = Object.keys(FILTER_PARAMETERS) as FilterType[];

	async function togglePlayback() {
		try {
			error = '';
			if (!isPlaying) {
				await synth.init();
				synth.setFrequency(frequency);
				synth.setVolume(volume);
				synth.setWaveType(waveType);
				synth.setFilterType(filterType);
				isPlaying = true;
			} else {
				await synth.stop();
				isPlaying = false;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to toggle playback';
			isPlaying = false;
		}
	}

	function updateFrequency(event: Event) {
		const input = event.target as HTMLInputElement;
		frequency = parseFloat(input.value);
		if (isPlaying) {
			synth.setFrequency(frequency);
		}
	}

	function updateVolume(event: Event) {
		const input = event.target as HTMLInputElement;
		volume = parseFloat(input.value);
		synth.setVolume(volume);
	}

	function updateWaveType(event: Event) {
		const select = event.target as HTMLSelectElement;
		waveType = select.value as WaveType;
		currentWaveParams = {}; // Reset params when changing wave type
		if (isPlaying) {
			synth.setWaveType(waveType);
		}
	}

	function updateFilterType(event: Event) {
		const select = event.target as HTMLSelectElement;
		filterType = select.value as FilterType;
		currentFilterParams = {}; // Reset params when changing filter type
		if (isPlaying) {
			synth.setFilterType(filterType);
		}
	}

	function updateWaveParameter(paramKey: string, event: Event) {
		const input = event.target as HTMLInputElement;
		const value = parseFloat(input.value);
		currentWaveParams[paramKey] = value;
		if (isPlaying) {
			synth.setWaveParameter(paramKey, value);
		}
	}

	function updateFilterParameter(paramKey: string, event: Event) {
		const input = event.target as HTMLInputElement;
		const value = parseFloat(input.value);
		currentFilterParams[paramKey] = value;
		if (isPlaying) {
			synth.setFilterParameter(paramKey, value);
		}
	}

	$: waveParams = WAVE_PARAMETERS[waveType];
	$: filterParams = FILTER_PARAMETERS[filterType];
</script>

<div class="container">
	<button on:click={togglePlayback}>
		{isPlaying ? 'Stop' : 'Start'}
	</button>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="section">
		<h3>Oscillator</h3>
		<div class="control">
			<label for="wave-type">Wave Type:</label>
			<select id="wave-type" value={waveType} on:change={updateWaveType}>
				{#each waveTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		<div class="control">
			<label for="frequency">Frequency: {frequency} Hz</label>
			<input
				type="range"
				id="frequency"
				min="20"
				max="2000"
				step="1"
				value={frequency}
				on:input={updateFrequency}
			/>
		</div>

		{#if Object.keys(waveParams).length > 0}
			<div class="parameters">
				<h4>Wave Parameters</h4>
				{#each Object.entries(waveParams) as [paramKey, param]}
					<div class="control">
						<label for={paramKey}
							>{param.name}: {currentWaveParams[paramKey] ?? param.default}</label
						>
						<input
							type="range"
							id={paramKey}
							min={param.min}
							max={param.max}
							step={param.step}
							value={currentWaveParams[paramKey] ?? param.default}
							on:input={(e) => updateWaveParameter(paramKey, e)}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="section">
		<h3>Filter</h3>
		<div class="control">
			<label for="filter-type">Filter Type:</label>
			<select id="filter-type" value={filterType} on:change={updateFilterType}>
				{#each filterTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		{#if Object.keys(filterParams).length > 0}
			<div class="parameters">
				<h4>Filter Parameters</h4>
				{#each Object.entries(filterParams) as [paramKey, param]}
					<div class="control">
						<label for={`filter-${paramKey}`}
							>{param.name}: {currentFilterParams[paramKey] ?? param.default}</label
						>
						<input
							type="range"
							id={`filter-${paramKey}`}
							min={param.min}
							max={param.max}
							step={param.step}
							value={currentFilterParams[paramKey] ?? param.default}
							on:input={(e) => updateFilterParameter(paramKey, e)}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="section">
		<h3>Amplifier</h3>
		<div class="control">
			<label for="volume">Volume: {Math.round(volume * 100)}%</label>
			<input
				type="range"
				id="volume"
				min="0"
				max="1"
				step="0.01"
				value={volume}
				on:input={updateVolume}
			/>
		</div>
	</div>
</div>

<style>
	.container {
		margin: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section {
		border: 1px solid #ccc;
		padding: 20px;
		border-radius: 5px;
	}

	.control {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 15px;
	}

	button {
		width: fit-content;
		padding: 10px 20px;
		font-size: 16px;
		cursor: pointer;
	}

	input[type='range'] {
		width: 300px;
	}

	select {
		width: fit-content;
		padding: 5px;
		font-size: 14px;
	}

	.error {
		color: red;
		font-weight: bold;
	}

	.parameters {
		margin-top: 15px;
	}

	h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
	}

	h4 {
		margin: 0 0 15px 0;
		font-size: 16px;
		color: #666;
	}
</style>
