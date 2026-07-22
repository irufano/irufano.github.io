<script lang="ts">
	import { page } from '$app/state';
	import PixelBackground from '$lib/components/PixelBackground.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let isNotFound = $derived(page.status === 404);
	let title = $derived(isNotFound ? 'Page Not Found' : 'Something Went Wrong');
	let description = $derived(
		page.error?.message ??
			(isNotFound
				? "The path you're looking for doesn't exist or was moved."
				: 'An unexpected error occurred. Please try again.')
	);
</script>

<svelte:head>
	<title>{page.status} - {title}</title>
</svelte:head>

<Navbar />
<main class="flex min-h-0 flex-1 flex-col">
	<section
		class="relative flex w-full flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-4 sm:px-6"
	>
		<PixelBackground />

		<div class="relative z-10 mx-auto max-w-3xl text-center">
			<span
				class="inline-flex items-center gap-2 rounded-none border border-border px-3 py-1 text-xs text-fg-muted"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
				Error {page.status}
			</span>

			<h1
				class="mt-4 text-3xl font-extrabold font-mono tracking-tight text-fg sm:text-5xl md:text-6xl"
			>
				{#if isNotFound}
					Page Not <span class="text-accent">Found</span>.
				{:else}
					Something <span class="text-accent">Went Wrong</span>.
				{/if}
			</h1>

			<p class="mx-auto mt-4 max-w-xl text-sm text-fg-muted sm:text-lg">
				{description}
			</p>
		</div>

		<div
			class="relative z-10 mx-auto w-full max-w-sm overflow-hidden rounded-none border border-border bg-bg-alt shadow-sm"
		>
			<div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
				<span class="h-2.5 w-2.5 rounded-full bg-fg-muted/30"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-fg-muted/30"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-fg-muted/30"></span>
			</div>
			<div class="flex flex-col gap-2 font-mono text-sm">
				<a
					href="/"
					class="group flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-bg"
				>
					<span class="text-fg">
						<span class="select-none text-accent">$</span> cd ~
						<span class="text-fg-muted"># back to home</span>
					</span>
					<span
						class="shrink-0 text-fg-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
						>&rarr;</span
					>
				</a>
			</div>
		</div>
	</section>
</main>
<Footer />
