<script lang="ts">
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import ThemeMenu from './ThemeMenu.svelte';
	import Menu from 'lucide-svelte/icons/menu';
	import X from 'lucide-svelte/icons/x';
	

	const links = [
		{ label: 'Posts', href: '/posts' },
		{ label: 'Tools', href: '/tools' }
	];

	let mobileOpen = $state(false);

	$effect(() => {
		// close the mobile menu whenever the route changes
		void page.url.pathname;
		mobileOpen = false;
	});
</script>

<header class="border-b border-border bg-bg/80 px-4 py-3 backdrop-blur sm:px-6">
	<div class="mx-auto flex w-full max-w-6xl items-center justify-between">
		<a href="/" class="flex items-center ">
			<Logo markSize={16} textSize={20} />
		</a>

		<div class="flex items-center gap-3">
			<nav class="hidden items-center gap-1 font-mono text-sm sm:flex">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="rounded-md px-3 py-1.5 transition {page.url.pathname.startsWith(link.href)
							? 'text-accent'
							: 'text-fg-muted hover:text-fg'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<ThemeMenu />
			<button
				aria-label="Toggle menu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
				class="inline-flex h-8 w-8 items-center justify-center rounded-none border border-border text-fg-muted transition hover:border-accent hover:text-fg sm:hidden"
			>
				{#if mobileOpen}
					<X class="h-4 w-4" />
				{:else}
					<Menu class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<nav class="mx-auto mt-3 flex w-full max-w-6xl flex-col gap-1 font-mono text-sm sm:hidden">
			{#each links as link (link.href)}
				<a
					href={link.href}
					onclick={() => (mobileOpen = false)}
					class="rounded-md px-3 py-2 transition {page.url.pathname.startsWith(link.href)
						? 'bg-accent/10 text-accent'
						: 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
				>
					{link.label}
				</a>
			{/each}
		</nav>
	{/if}
</header>
