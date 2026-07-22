<script lang="ts">
	import { page } from '$app/state';
	import LogoMark from './LogoMark.svelte';
	import { TOOLS, groupToolsByCategory, CATEGORY_ICONS } from '$lib/tools';
	import Wrench from 'lucide-svelte/icons/wrench';
	import PanelLeftClose from './PanelLeftCloseIcon.svelte';
	import PanelLeftOpen from './PanelLeftOpenIcon.svelte';

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

	let tooltipText = $state<string | null>(null);
	let tooltipPos = $state({ top: 0, left: 0 });

	function showTooltip(e: { currentTarget: EventTarget | null }, text: string) {
		if (!collapsed) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tooltipPos = { top: rect.top + rect.height / 2, left: rect.right + 8 };
		tooltipText = text;
	}

	function hideTooltip() {
		tooltipText = null;
	}
</script>

{#snippet sidebarContent(isCollapsed: boolean, showToggle: boolean)}
	<div class="group relative flex items-center justify-between mx-4 my-4">
		<a
			href={isCollapsed ? undefined : '/'}
			aria-disabled={isCollapsed}
			tabindex={isCollapsed ? -1 : undefined}
			class="flex items-center w-min border-border ml-1 {isCollapsed
				? 'pointer-events-none transition-opacity duration-150 group-hover:opacity-0'
				: ''}"
		>
			<LogoMark size={20} />
			<span
				class="overflow-hidden whitespace-nowrap font-mono text-xl font-bold leading-none text-fg transition-all duration-200 {isCollapsed
					? 'ml-0 max-w-0 opacity-0'
					: 'ml-1.5 max-w-32 opacity-100'}"
			>
				irufano
			</span>
		</a>
		{#if showToggle}
			<button
				aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				onclick={oncollapse}
				class="z-10 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-none border-border bg-bg text-fg-muted transition hover:border-accent hover:text-fg {isCollapsed
					? 'absolute inset-0 m-auto opacity-0 group-hover:opacity-100'
					: ''}"
			>
				{#if isCollapsed}
					<PanelLeftOpen class="h-6 w-6" />
				{:else}
					<PanelLeftClose class="h-6 w-6" />
				{/if}
			</button>
		{/if}
	</div>
	<div class="border-b border-border"></div>
	<nav class="sidebar-scroll flex flex-1 flex-col gap-1 overflow-y-auto p-3 font-mono text-sm">
		<a
			href="/tools"
			onclick={onnavigate}
			onmouseenter={(e) => showTooltip(e, 'All Tools')}
			onmouseleave={hideTooltip}
			title="All Tools"
			class="flex items-center rounded-none px-3 py-2 font-semibold transition {page.url.pathname ===
			'/tools'
				? 'bg-accent/10 text-accent'
				: 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
		>
			<Wrench class="h-4 w-4 shrink-0" />
			<span
				class="overflow-hidden whitespace-nowrap transition-all duration-200 {isCollapsed
					? 'ml-0 max-w-0 opacity-0'
					: 'ml-2 max-w-40 opacity-100'}"
			>
				All Tools
			</span>
		</a>

		{#each groupToolsByCategory(TOOLS) as group (group.category)}
			{@const CategoryIcon = CATEGORY_ICONS[group.category]}
			<div class="relative flex items-center px-3 pb-1 pt-5">
				<p
					class="overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-fg transition-all duration-200 {isCollapsed
						? 'max-w-0 opacity-0'
						: 'max-w-40 opacity-100'}"
				>
					{group.category}
				</p>
				<div
					role="img"
					aria-label={group.category}
					title={group.category}
					onmouseenter={(e) => showTooltip(e, group.category)}
					onmouseleave={hideTooltip}
					class="absolute left-3 flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-none text-accent/40 transition-opacity duration-200 {isCollapsed
						? 'opacity-100'
						: 'pointer-events-none opacity-0'}"
				>
					<CategoryIcon class="h-3.5 w-3.5 shrink-0" />
				</div>
			</div>
			{#each group.tools as tool (tool.slug)}
				{@const href = `/tools/${tool.slug}`}
				{@const Icon = tool.icon}
				<a
					{href}
					onclick={onnavigate}
					onmouseenter={(e) => showTooltip(e, tool.label)}
					onmouseleave={hideTooltip}
					title={tool.label}
					class="flex items-center rounded-none px-3 py-2 transition {page.url.pathname === href
						? 'bg-accent/10 text-accent'
						: 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
				>
					<Icon class="h-4 w-4 shrink-0" />
					<span
						class="overflow-hidden whitespace-nowrap transition-all duration-200 {isCollapsed
							? 'ml-0 max-w-0 opacity-0'
							: 'ml-2 max-w-40 opacity-100'}"
					>
						{tool.label}
					</span>
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
	{@render sidebarContent(collapsed, true)}
</aside>

{#if tooltipText}
	<div
		class="pointer-events-none fixed z-60 -translate-y-1/2 whitespace-nowrap rounded-none border border-border bg-bg px-2 py-1 text-xs text-fg shadow-md"
		style="top: {tooltipPos.top}px; left: {tooltipPos.left}px;"
	>
		{tooltipText}
	</div>
{/if}

{#if open}
	<div class="fixed inset-0 z-50 lg:hidden">
		<button
			aria-label="Close menu"
			class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
			onclick={onnavigate}
		></button>
		<aside class="relative flex h-full w-64 flex-col border-r border-border bg-bg">
			{@render sidebarContent(false, false)}
		</aside>
	</div>
{/if}

<style>
	.sidebar-scroll {
		scrollbar-color: transparent transparent;
	}

	.sidebar-scroll:hover,
	.sidebar-scroll:focus-within {
		scrollbar-color: var(--color-border) transparent;
	}

	.sidebar-scroll::-webkit-scrollbar-thumb {
		background-color: transparent;
		border-color: transparent;
	}

	.sidebar-scroll:hover::-webkit-scrollbar-thumb,
	.sidebar-scroll:focus-within::-webkit-scrollbar-thumb {
		background-color: var(--color-border);
		border-color: var(--color-bg);
	}
</style>

