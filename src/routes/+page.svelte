<script lang="ts">
	import { SynthController } from '$lib/controller';
	import type { WaveType, WaveParameter } from '$lib/waves';
	import { WAVE_PARAMETERS } from '$lib/waves';
	import { onMount } from 'svelte';

	const synth = new SynthController();
	let frequency = 440;
	let volume = 0.5;
	let isPlaying = false;
	let error = '';
	let waveType: WaveType = 'square';
	let currentParams: { [key: string]: number } = {};

	const waveTypes: WaveType[] = Object.keys(WAVE_PARAMETERS) as WaveType[];

	async function togglePlayback() {
		try {
			error = '';
			if (!isPlaying) {
				await synth.init();
				synth.setFrequency(frequency);
				synth.setVolume(volume);
				synth.setWaveType(waveType);
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
		currentParams = {}; // Reset params when changing wave type
		if (isPlaying) {
			synth.setWaveType(waveType);
		}
	}

	function updateParameter(paramKey: string, event: Event) {
		const input = event.target as HTMLInputElement;
		const value = parseFloat(input.value);
		currentParams[paramKey] = value;
		if (isPlaying) {
			synth.setWaveParameter(paramKey, value);
		}
	}

	$: waveParams = WAVE_PARAMETERS[waveType];
</script>

<div class="container">
	<button on:click={togglePlayback}>
		{isPlaying ? 'Stop' : 'Start'}
	</button>

	{#if error}
		<div class="error">{error}</div>
	{/if}

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

	{#if Object.keys(waveParams).length > 0}
		<div class="parameters">
			<h3>Wave Parameters</h3>
			{#each Object.entries(waveParams) as [paramKey, param]}
				<div class="control">
					<label for={paramKey}>{param.name}: {currentParams[paramKey] ?? param.default}</label>
					<input
						type="range"
						id={paramKey}
						min={param.min}
						max={param.max}
						step={param.step}
						value={currentParams[paramKey] ?? param.default}
						on:input={(e) => updateParameter(paramKey, e)}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		margin: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.control {
		display: flex;
		flex-direction: column;
		gap: 10px;
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
		border-top: 1px solid #ccc;
		padding-top: 20px;
		margin-top: 10px;
	}

	h3 {
		margin: 0 0 15px 0;
		font-size: 16px;
	}
</style>
