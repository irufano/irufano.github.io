<script lang="ts">
	let { tabs }: { tabs: { label: string; command: string }[] } = $props();

	let active = $state(0);
	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(tabs[active].command);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="overflow-hidden rounded-lg border border-border bg-bg-alt shadow-sm">
	<div class="flex items-center border-b border-border px-2">
		{#each tabs as tab, i (tab.label)}
			<button
				onclick={() => (active = i)}
				class="border-b-2 px-3 py-2 font-mono text-xs transition {active === i
					? 'border-accent text-accent'
					: 'border-transparent text-fg-muted hover:text-fg'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="flex items-center justify-between gap-4 px-4 py-3">
		<code class="overflow-x-auto whitespace-pre font-mono text-sm text-fg">
			<span class="text-accent select-none">$</span>
			{tabs[active].command}
		</code>
		<button
			onclick={copy}
			aria-label="Copy command"
			class="shrink-0 rounded-md p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
		>
			{#if copied}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4 text-green-400">
					<path stroke-linecap="round" stroke-linejoin="round" d="m5 12 5 5L20 7" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
					<rect x="9" y="9" width="11" height="11" rx="2" />
					<path d="M5 15V5a2 2 0 0 1 2-2h10" />
				</svg>
			{/if}
		</button>
	</div>
</div>
