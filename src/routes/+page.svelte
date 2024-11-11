<script lang="ts">
	import { SynthController } from '$lib/controller';

	const synth = new SynthController();
</script>

<button
	onclick={async () => {
		await synth.init();
		synth.playSequence(['c4', 'd4', 'eb4', 'f#4', 'g4', 'a4', 'b4', 'c5']);
	}}>Play Sequence</button
>
