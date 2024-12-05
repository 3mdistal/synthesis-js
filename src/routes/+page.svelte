<script lang="ts">
	import { SynthController } from '$lib/controller';
	import { onMount } from 'svelte';

	const synth = new SynthController();
	let frequency = 440;
	let volume = 0.5;
	let isPlaying = false;
	let error = '';
	let oscType: 'sine' | 'square' = 'square';

	async function togglePlayback() {
		try {
			error = '';
			if (!isPlaying) {
				await synth.init();
				synth.setFrequency(frequency);
				synth.setVolume(volume);
				synth.setOscType(oscType);
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

	function updateOscType(event: Event) {
		const select = event.target as HTMLSelectElement;
		oscType = select.value as 'sine' | 'square';
		if (isPlaying) {
			synth.setOscType(oscType);
		}
	}
</script>

<div class="container">
	<button on:click={togglePlayback}>
		{isPlaying ? 'Stop' : 'Start'}
	</button>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="control">
		<label for="osc-type">Oscillator Type:</label>
		<select id="osc-type" value={oscType} on:change={updateOscType}>
			<option value="square">Square</option>
			<option value="sine">Sine</option>
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
</style>
