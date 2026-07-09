<script lang="ts">
	import LogoMark from './LogoMark.svelte';

	let { markSize = 24, textSize = 24 }: { markSize?: number; textSize?: number } = $props();
</script>

<span class="inline-flex items-center gap-1.5" role="img" aria-label="irufano">
	<LogoMark size={markSize} />
	<span
		class="font-mono font-bold leading-none text-fg"
		style="font-size: {textSize}px;"
	>
		irufano
	</span>
</span>
