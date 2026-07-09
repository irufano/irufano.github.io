<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Random Picker — Tools — irufano';
	const description =
		'Paste a list of names or options and pick a random winner, with an animated reveal and pick history.';
	const canonicalUrl = `${SITE_URL}/tools/random-picker`;

	import { onDestroy } from 'svelte';
	import Dices from 'lucide-svelte/icons/dices';
	import Shuffle from 'lucide-svelte/icons/shuffle';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import History from 'lucide-svelte/icons/history';
	import ListRestart from 'lucide-svelte/icons/list-restart';
	import {
		randomPickerState,
		saveRandomPickerState,
		RANDOM_PICKER_EXAMPLE,
		type RandomPickerHistoryEntry
	} from '$lib/state/random-picker.svelte';

	let input = $state(randomPickerState.input);
	let removeOnPick = $state(randomPickerState.removeOnPick);
	let noImmediateRepeat = $state(randomPickerState.noImmediateRepeat);
	let history = $state<RandomPickerHistoryEntry[]>(randomPickerState.history);
	let remaining = $state<string[]>(randomPickerState.remaining);
	let poolSourceKey = $state(randomPickerState.poolSourceKey);

	let spinning = $state(false);
	let justPicked = $state(false);
	let displayValue = $state(randomPickerState.history[0]?.value ?? '');
	let copied = $state(false);

	let spinTimeout: ReturnType<typeof setTimeout> | undefined;
	let popTimeout: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => {
		clearTimeout(spinTimeout);
		clearTimeout(popTimeout);
	});

	const items = $derived.by(() =>
		input
			.split(/\r\n|\r|\n/)
			.map((line) => line.trim())
			.filter(Boolean)
	);

	const uniqueCount = $derived(new Set(items).size);

	// Keeps the "remove after pick" pool in sync with the input, but only
	// resets it when the input actually changes — not on every render — so a
	// depleted pool survives navigation and page refresh.
	$effect(() => {
		const key = items.join('\n');
		if (key !== poolSourceKey) {
			poolSourceKey = key;
			remaining = [...items];
		}
	});

	const pool = $derived(removeOnPick ? remaining : items);

	const summaryStats = $derived([
		{ label: 'Total items', value: items.length },
		{ label: 'Unique items', value: uniqueCount },
		{ label: 'Remaining', value: removeOnPick ? remaining.length : items.length },
		{ label: 'Picks made', value: history.length }
	]);

	$effect(() => {
		randomPickerState.input = input;
		randomPickerState.removeOnPick = removeOnPick;
		randomPickerState.noImmediateRepeat = noImmediateRepeat;
		randomPickerState.history = history;
		randomPickerState.remaining = remaining;
		randomPickerState.poolSourceKey = poolSourceKey;
		saveRandomPickerState();
	});

	function pickIndex(list: string[], avoid: string | null): number {
		if (!list.length) return -1;
		if (list.length === 1 || avoid === null) return Math.floor(Math.random() * list.length);
		const candidates = [...list.keys()].filter((i) => list[i] !== avoid);
		if (!candidates.length) return Math.floor(Math.random() * list.length);
		return candidates[Math.floor(Math.random() * candidates.length)];
	}

	function pick() {
		if (spinning || !pool.length) return;

		const source = pool;
		const avoid = noImmediateRepeat ? (history[0]?.value ?? null) : null;
		const winnerIndex = pickIndex(source, avoid);
		const winner = source[winnerIndex];
		const cycleFrom = items.length ? items : source;

		spinning = true;
		justPicked = false;

		const totalTicks = 22;
		let tick = 0;

		function step() {
			tick++;
			if (tick >= totalTicks) {
				displayValue = winner;
				finishPick(winner, winnerIndex);
				return;
			}
			displayValue = cycleFrom[Math.floor(Math.random() * cycleFrom.length)];
			const progress = tick / totalTicks;
			const delay = 35 + progress * progress * 230;
			spinTimeout = setTimeout(step, delay);
		}

		step();
	}

	function finishPick(winner: string, winnerIndex: number) {
		spinning = false;
		history = [{ value: winner, at: Date.now() }, ...history].slice(0, 50);
		if (removeOnPick) {
			remaining = remaining.filter((_, i) => i !== winnerIndex);
		}
		justPicked = true;
		popTimeout = setTimeout(() => (justPicked = false), 500);
	}

	function refillPool() {
		remaining = [...items];
	}

	function clearHistory() {
		history = [];
	}

	async function copyWinner() {
		if (!displayValue) return;
		await navigator.clipboard.writeText(displayValue);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	async function pasteInput() {
		try {
			input = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable — ignore
		}
	}

	function loadExample() {
		input = RANDOM_PICKER_EXAMPLE;
	}

	function clearInput() {
		input = '';
	}

	function shuffleList() {
		const shuffled = [...items];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		input = shuffled.join('\n');
	}

	function formatTime(at: number): string {
		return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section class="w-full px-4 py-10 sm:px-6">
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Random Picker</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Paste one item per line and spin to pick a random winner. Duplicate lines get extra weight.
		Everything runs locally and your list is kept when you switch tools or refresh the page.
	</p>

	<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stat.value}</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Options -->
	<div class="mt-6 flex flex-wrap items-center gap-4">
		<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
			<input type="checkbox" bind:checked={removeOnPick} class="cursor-pointer accent-accent" />
			Remove picked item from pool
		</label>
		<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
			<input type="checkbox" bind:checked={noImmediateRepeat} class="cursor-pointer accent-accent" />
			Avoid picking the same twice in a row
		</label>

		{#if removeOnPick && items.length > 0 && remaining.length < items.length}
			<button
				onclick={refillPool}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
			>
				<ListRestart class="h-3.5 w-3.5" />
				Refill pool ({remaining.length}/{items.length})
			</button>
		{/if}
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Input -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="rp-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Item list
				</label>
				<div class="flex items-center gap-1">
					<button
						onclick={loadExample}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						<Wand2 class="h-3.5 w-3.5" />
						Example
					</button>
					<button
						onclick={shuffleList}
						disabled={items.length < 2}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
					>
						<Shuffle class="h-3.5 w-3.5" />
						Shuffle
					</button>
					<button
						onclick={pasteInput}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						<Clipboard class="h-3.5 w-3.5" />
						Paste
					</button>
					<button
						onclick={clearInput}
						disabled={!input}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
					>
						<Trash2 class="h-3.5 w-3.5" />
						Clear
					</button>
				</div>
			</div>

			<textarea
				id="rp-input"
				bind:value={input}
				placeholder={'Alice\nBob\nCharlie'}
				rows="14"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>

			<p class="mt-2 text-xs text-fg-muted">One item per line. Blank lines are ignored.</p>
		</div>

		<!-- Result -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<span class="font-mono text-xs uppercase tracking-wide text-fg-muted">Result</span>
				<button
					onclick={copyWinner}
					disabled={!displayValue || spinning}
					class="flex items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
				>
					{#if copied}
						<Check class="h-3.5 w-3.5 text-accent" />
						Copied
					{:else}
						<Copy class="h-3.5 w-3.5" />
						Copy
					{/if}
				</button>
			</div>

			<div
				aria-live={spinning ? 'off' : 'polite'}
				class={`rp-result mt-2 flex h-40 items-center justify-center rounded-none border p-4 text-center transition-colors ${
					spinning
						? 'rp-result-spinning border-accent/60'
						: justPicked
							? 'rp-result-pop border-accent'
							: 'border-border'
				} bg-bg-alt`}
				style={spinning || justPicked
					? 'box-shadow: 0 0 40px color-mix(in srgb, var(--color-accent) 30%, transparent);'
					: ''}
			>
				{#if displayValue}
					<p class="break-all font-mono text-xl font-bold text-fg sm:text-2xl">
						<span class={spinning ? 'text-fg-muted' : 'text-accent'}>{displayValue}</span>{#if spinning}<span
								class="rp-caret text-accent">▍</span
							>{/if}
					</p>
				{:else}
					<p class="text-sm text-fg-muted">Add items and hit Pick</p>
				{/if}
			</div>

			<button
				onclick={pick}
				disabled={!pool.length || spinning}
				class="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-none border border-accent bg-accent px-4 py-3 text-xs font-mono uppercase tracking-wide text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Dices class={spinning ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
				{spinning ? 'Picking...' : !pool.length ? 'Pool is empty' : 'Pick'}
			</button>
		</div>
	</div>

	<!-- History -->
	<div class="mt-8">
		<div class="flex items-center justify-between gap-2">
			<span class="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-fg-muted">
				<History class="h-3.5 w-3.5" />
				Pick history
			</span>
			<button
				onclick={clearHistory}
				disabled={!history.length}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
			>
				<Trash2 class="h-3.5 w-3.5" />
				Clear history
			</button>
		</div>

		{#if history.length}
			<ul class="mt-2 max-h-64 divide-y divide-border overflow-y-auto rounded-none border border-border bg-bg-alt">
				{#each history as entry, i (entry.at)}
					<li class="flex items-center justify-between gap-3 px-4 py-2 text-sm">
						<span class="flex items-center gap-3">
							<span class="font-mono text-xs text-fg-muted">#{history.length - i}</span>
							<span class="text-fg">{entry.value}</span>
						</span>
						<span class="font-mono text-xs text-fg-muted">{formatTime(entry.at)}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-sm text-fg-muted">No picks yet — your history will show up here.</p>
		{/if}
	</div>
</section>

<style>
	@keyframes rp-pop {
		0% {
			transform: scale(0.92);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes rp-flicker {
		0%,
		100% {
			opacity: 1;
		}
		45% {
			opacity: 0.75;
		}
		50% {
			opacity: 1;
		}
		55% {
			opacity: 0.85;
		}
	}

	@keyframes rp-caret {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	.rp-result-pop {
		animation: rp-pop 0.4s ease-out;
	}

	.rp-result-spinning {
		animation: rp-flicker 0.12s steps(2) infinite;
	}

	.rp-caret {
		animation: rp-caret 0.8s steps(1) infinite;
		margin-left: 2px;
	}
</style>
