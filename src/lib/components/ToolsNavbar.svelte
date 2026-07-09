<script lang="ts">
	import { page } from '$app/state';
	import ThemeMenu from './ThemeMenu.svelte';
	import Menu from 'lucide-svelte/icons/menu';
	import Wrench from 'lucide-svelte/icons/wrench';
	import { TOOLS } from '$lib/tools';

	let { onmenu }: { onmenu?: () => void } = $props();

	const links = [
		{ label: 'Posts', href: '/posts' },
		{ label: 'Tools', href: '/tools' }
	];

	let currentTool = $derived(TOOLS.find((tool) => page.url.pathname === `/tools/${tool.slug}`));
	let title = $derived(currentTool?.label ?? 'Tools');
	let TitleIcon = $derived(currentTool?.icon ?? Wrench);
</script>

<header class="border-b border-border bg-bg/80 px-4 py-3 backdrop-blur sm:px-6">
	<div class="flex w-full items-center justify-between gap-2">
		<div class="flex min-w-0 items-center gap-3 ml-2">
			<button
				aria-label="Toggle tools menu"
				onclick={onmenu}
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-border text-fg-muted transition hover:border-accent hover:text-fg lg:hidden"
			>
				<Menu class="h-4 w-4" />
			</button>
			<a href="/tools" class="flex min-w-0 items-center gap-2 font-mono text-sm text-fg">
				<TitleIcon class="h-4 w-4 shrink-0 text-accent" />
				<span class="truncate font-semibold">{title}</span>
			</a>
		</div>

		<div class="flex shrink-0 items-center gap-2 sm:gap-3">
			<nav class="hidden items-center gap-1 font-mono text-xs sm:flex">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="rounded-none px-2.5 py-1.5 transition {page.url.pathname.startsWith(link.href)
							? 'text-accent'
							: 'text-fg-muted hover:text-fg'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<ThemeMenu />
		</div>
	</div>
</header>
