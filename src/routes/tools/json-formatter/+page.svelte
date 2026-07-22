<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'JSON Formatter - Tools - irufano';
	const description = 'Format, validate, and minify JSON with instant error feedback.';
	const canonicalUrl = `${SITE_URL}/tools/json-formatter`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import {
		jsonFormatterState,
		JSON_EXAMPLE,
		type JsonIndent
	} from '$lib/state/json-formatter.svelte';

	let input = $state(jsonFormatterState.input);
	let indent = $state<JsonIndent>(jsonFormatterState.indent);
	let copied = $state(false);

	$effect(() => {
		jsonFormatterState.input = input;
		jsonFormatterState.indent = indent;
	});

	const parsed = $derived.by((): { ok: true; value: unknown } | { ok: false; error: string } => {
		try {
			return { ok: true, value: JSON.parse(input) };
		} catch (e) {
			return { ok: false, error: (e as Error).message };
		}
	});

	const output = $derived.by(() => {
		if (!input.trim() || !parsed.ok) return '';
		const space = indent === 'tab' ? '\t' : indent === 'min' ? undefined : Number(indent);
		return JSON.stringify(parsed.value, null, space);
	});

	function countNodes(value: unknown): number {
		if (Array.isArray(value)) {
			return value.reduce((sum: number, v) => sum + countNodes(v), 0);
		}
		if (value && typeof value === 'object') {
			return (
				Object.keys(value).length +
				Object.values(value).reduce((sum: number, v) => sum + countNodes(v), 0)
			);
		}
		return 0;
	}

	const stats = $derived.by(() => {
		if (!input.trim()) return { status: 'Empty', keys: 0, size: '0 B' };
		if (!parsed.ok) return { status: 'Invalid', keys: 0, size: '0 B' };
		const bytes = new TextEncoder().encode(output).length;
		const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
		return { status: 'Valid', keys: countNodes(parsed.value), size };
	});

	const summaryStats = $derived([
		{ label: 'Status', value: stats.status },
		{ label: 'Keys', value: stats.keys },
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
			// clipboard read denied or unavailable - ignore
		}
	}

	function loadExample() {
		input = JSON_EXAMPLE;
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">JSON Formatter</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Paste JSON to validate, beautify, or minify it. Errors show up as you type.
	</p>

	<div class="mt-8 grid grid-cols-3 gap-3 sm:max-w-sm">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p
					class={`font-mono text-lg font-bold sm:text-xl ${
						stat.label === 'Status' && stat.value === 'Invalid' ? 'text-red-400' : 'text-accent'
					}`}
				>
					{stat.value}
				</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Options -->
	<div class="mt-6 flex flex-wrap items-center gap-4">
		<div class="inline-flex rounded-none border border-border">
			<button
				onclick={() => (indent = '2')}
				class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					indent === '2' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				2 spaces
			</button>
			<button
				onclick={() => (indent = '4')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					indent === '4' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				4 spaces
			</button>
			<button
				onclick={() => (indent = 'tab')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					indent === 'tab' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Tab
			</button>
			<button
				onclick={() => (indent = 'min')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					indent === 'min' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Minified
			</button>
		</div>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Input -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="json-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
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
				id="json-input"
				bind:value={input}
				placeholder={'{ "hello": "world" }'}
				rows="20"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>

			{#if input.trim() && !parsed.ok}
				<p class="mt-2 flex items-start gap-1.5 text-xs text-red-400">
					<CircleX class="mt-0.5 h-3.5 w-3.5 shrink-0" />
					{parsed.error}
				</p>
			{:else if input.trim() && parsed.ok}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-accent">
					<CircleCheck class="h-3.5 w-3.5 shrink-0" />
					Valid JSON
				</p>
			{/if}
		</div>

		<!-- Output -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="json-output" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
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
				id="json-output"
				value={output}
				readonly
				placeholder="Formatted JSON will appear here..."
				rows="20"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>
</section>
