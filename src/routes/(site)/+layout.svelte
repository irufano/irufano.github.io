<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	// the post detail page renders its own Footer inside its scrollable article
	// section, so it appears at the true end of the article — other pages keep
	// the footer pinned via the shell below
	let isPostPage = $derived(page.route.id === '/(site)/posts/[category]/[slug]');
</script>

<Navbar />
<main class="flex min-h-0 flex-1 flex-col">
	{@render children()}
</main>
{#if !isPostPage}
	<Footer />
{/if}
