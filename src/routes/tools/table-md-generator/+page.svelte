<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Table MD Generator — Tools — irufano';
	const description =
		'Paste CSV, TSV, or delimited data and get a clean Markdown table, ready to paste into a README.';
	const canonicalUrl = `${SITE_URL}/tools/table-md-generator`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import {
		tableMdGeneratorState,
		TABLE_EXAMPLE,
		type TableDelimiter,
		type TableAlignment
	} from '$lib/state/table-md-generator.svelte';
	import { detectDelimiter, parseDelimited, buildMarkdownTable } from '$lib/utils/markdown-table';

	let input = $state(tableMdGeneratorState.input);
	let delimiter = $state<TableDelimiter>(tableMdGeneratorState.delimiter);
	let hasHeader = $state(tableMdGeneratorState.hasHeader);
	let alignment = $state<TableAlignment>(tableMdGeneratorState.alignment);
	let pretty = $state(tableMdGeneratorState.pretty);
	let copied = $state(false);

	$effect(() => {
		tableMdGeneratorState.input = input;
		tableMdGeneratorState.delimiter = delimiter;
		tableMdGeneratorState.hasHeader = hasHeader;
		tableMdGeneratorState.alignment = alignment;
		tableMdGeneratorState.pretty = pretty;
	});

	const rows = $derived.by(() => {
		if (!input.trim()) return [];
		const d = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
		return parseDelimited(input, d);
	});

	const output = $derived(buildMarkdownTable(rows, hasHeader, alignment, pretty));

	const stats = $derived.by(() => {
		const columns = rows.length ? Math.max(...rows.map((r) => r.length)) : 0;
		const dataRows = hasHeader ? Math.max(0, rows.length - 1) : rows.length;
		const bytes = new TextEncoder().encode(output).length;
		const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
		return { columns, dataRows, size };
	});

	const summaryStats = $derived([
		{ label: 'Columns', value: stats.columns },
		{ label: 'Rows', value: stats.dataRows },
		{ label: 'Size', value: stats.size }
	]);

	async function copyOutput() {
		if (!output) return;
		await navigator.clipboard.writeText(output);
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
		input = TABLE_EXAMPLE;
	}

	function clearInput() {
		input = '';
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Table MD Generator</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Paste CSV, TSV, or other delimited data and get a clean Markdown table.
	</p>

	<div class="mt-8 grid max-w-sm grid-cols-3 gap-3">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stat.value}</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Options -->
	<div class="mt-6 flex flex-wrap items-center gap-4">
		<div class="flex items-center gap-2">
			<label for="delimiter" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				Delimiter
			</label>
			<div class="relative">
				<select
					id="delimiter"
					bind:value={delimiter}
					class="cursor-pointer appearance-none rounded-none border border-border bg-bg-alt py-1.5 pl-2 pr-7 text-xs text-fg focus:border-accent focus:outline-none"
				>
					<option value="auto">Auto-detect</option>
					<option value=",">Comma</option>
					<option value={'\t'}>Tab</option>
					<option value=";">Semicolon</option>
					<option value="|">Pipe</option>
				</select>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-muted"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
				</svg>
			</div>
		</div>

		<div class="inline-flex rounded-none border border-border">
			<button
				onclick={() => (alignment = 'none')}
				class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					alignment === 'none' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Default
			</button>
			<button
				onclick={() => (alignment = 'left')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					alignment === 'left' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Left
			</button>
			<button
				onclick={() => (alignment = 'center')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					alignment === 'center' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Center
			</button>
			<button
				onclick={() => (alignment = 'right')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					alignment === 'right' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Right
			</button>
		</div>

		<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
			<input type="checkbox" bind:checked={hasHeader} class="cursor-pointer accent-accent" />
			First row is header
		</label>

		<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
			<input type="checkbox" bind:checked={pretty} class="cursor-pointer accent-accent" />
			Pad columns
		</label>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Input -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="table-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Input
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
				id="table-input"
				bind:value={input}
				placeholder={'Name,Role,Location\nIrufano,Developer,Indonesia'}
				rows="16"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>

			<p class="mt-2 text-xs text-fg-muted">
				Paste CSV, TSV, or semicolon/pipe-delimited data — quoted fields with embedded delimiters
				are supported. Cells containing <code class="text-fg">|</code> are escaped automatically.
			</p>
		</div>

		<!-- Output -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="table-output" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Output
				</label>
				<button
					onclick={copyOutput}
					disabled={!output}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
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

			<textarea
				id="table-output"
				value={output}
				readonly
				placeholder="Markdown table will appear here..."
				rows="16"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>
</section>
