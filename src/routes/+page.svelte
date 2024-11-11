<script lang="ts">
	import { SynthController } from '$lib/controller';

	const synth = new SynthController();
</script>

<button
	onclick={async () => {
		await synth.init();
		synth.playSequence(['c4', 'd4', 'e4', 'f4', 'g4', 'a4', 'b4']);
	}}>Play Sequence</button
>
