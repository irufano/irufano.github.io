<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#4ade80" />
</svelte:head>

<div class="flex h-dvh flex-col overflow-hidden bg-bg text-fg antialiased">
	{@render children()}
</div>
