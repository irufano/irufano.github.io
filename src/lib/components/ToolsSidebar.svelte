<script lang="ts">
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import LogoMark from './LogoMark.svelte';
	import { TOOLS, groupToolsByCategory } from '$lib/tools';
	import Wrench from 'lucide-svelte/icons/wrench';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

	let {
		open = false,
		collapsed = false,
		onnavigate,
		oncollapse
	}: {
		open?: boolean;
		collapsed?: boolean;
		onnavigate?: () => void;
		oncollapse?: () => void;
	} = $props();
</script>

{#snippet sidebarContent(isCollapsed: boolean)}
	<a
		href="/"
		class="flex items-center border-b border-border px-4 py-4 {isCollapsed ? 'justify-center' : ''}"
	>
		{#if isCollapsed}
			<LogoMark size={16} />
		{:else}
			<Logo markSize={16} textSize={20} />
		{/if}
	</a>
	<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3 font-mono text-sm">
		<a
			href="/tools"
			onclick={onnavigate}
			title="All Tools"
			class="flex items-center gap-2 rounded-none px-3 py-2 font-semibold transition {isCollapsed
				? 'justify-center'
				: ''} {page.url.pathname === '/tools'
				? 'bg-accent/10 text-accent'
				: 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
		>
			<Wrench class="h-4 w-4 shrink-0" />
			{#if !isCollapsed}
				All Tools
			{/if}
		</a>

		{#each groupToolsByCategory(TOOLS) as group (group.category)}
			{#if !isCollapsed}
				<p class="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
					{group.category}
				</p>
			{/if}
			{#each group.tools as tool (tool.slug)}
				{@const href = `/tools/${tool.slug}`}
				{@const Icon = tool.icon}
				<a
					{href}
					onclick={onnavigate}
					title={tool.label}
					class="flex items-center gap-2 rounded-none px-3 py-2 transition {isCollapsed
						? 'justify-center'
						: ''} {page.url.pathname === href
						? 'bg-accent/10 text-accent'
						: 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
				>
					<Icon class="h-4 w-4 shrink-0" />
					{#if !isCollapsed}
						{tool.label}
					{/if}
				</a>
			{/each}
		{/each}
	</nav>
{/snippet}

<aside
	class="relative hidden h-full shrink-0 flex-col border-r border-border bg-bg-alt/40 transition-[width] duration-200 lg:flex {collapsed
		? 'w-16'
		: 'w-64'}"
>
	{@render sidebarContent(collapsed)}

	<button
		aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		onclick={oncollapse}
		class="z-50 absolute -right-3 top-4 cursor-pointer hidden h-5 w-5 items-center justify-center rounded-none border border-border bg-bg text-fg-muted transition hover:border-accent hover:text-fg lg:flex"
	>
		{#if collapsed}
			<ChevronRight class="h-3.5 w-3.5" />
		{:else}
			<ChevronLeft class="h-3.5 w-3.5" />
		{/if}
	</button>
</aside>

{#if open}
	<div class="fixed inset-0 z-50 lg:hidden">
		<button
			aria-label="Close menu"
			class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
			onclick={onnavigate}
		></button>
		<aside class="relative flex h-full w-64 flex-col border-r border-border bg-bg">
			{@render sidebarContent(false)}
		</aside>
	</div>
{/if}
