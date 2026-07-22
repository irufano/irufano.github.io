<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	let { class: className = '', ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="square"
	stroke-linejoin="miter"
	class={className}
	{...rest}
>
	<rect width="18" height="18" x="3" y="3" />
	<path d="M9 3v18" />
	<path d="m14 9 3 3-3 3" />
</svg>
