<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'JSON String Escaper - Tools - irufano';
	const description =
		'Unescape a JSON-encoded string into valid JSON, or escape JSON back into a quoted string.';
	const canonicalUrl = `${SITE_URL}/tools/json-string-escape`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
	import CircleCheck from 'lucide-svelte/icons/circle-check';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import {
		jsonStringEscapeState,
		JSON_STRING_ESCAPE_EXAMPLE,
		type JsonStringMode,
		type JsonIndent
	} from '$lib/state/json-string-escape.svelte';

	let input = $state(jsonStringEscapeState.input);
	let mode = $state<JsonStringMode>(jsonStringEscapeState.mode);
	let indent = $state<JsonIndent>(jsonStringEscapeState.indent);
	let copied = $state(false);

	$effect(() => {
		jsonStringEscapeState.input = input;
		jsonStringEscapeState.mode = mode;
		jsonStringEscapeState.indent = indent;
	});

	function indentSpace(value: JsonIndent): string | number | undefined {
		if (value === 'tab') return '\t';
		if (value === 'min') return undefined;
		return Number(value);
	}

	type ConvertResult = { ok: true; value: string } | { ok: false; error: string };

	function unescapeJson(raw: string): ConvertResult {
		const trimmed = raw.trim();
		let current: unknown;
		try {
			current = JSON.parse(trimmed);
		} catch {
			try {
				current = JSON.parse(`"${trimmed}"`);
			} catch {
				return { ok: false, error: 'Not a valid JSON string - check quoting and escape sequences.' };
			}
		}
		// Repeatedly unwrap in case the string was escaped more than once.
		while (typeof current === 'string') {
			try {
				current = JSON.parse(current);
			} catch {
				break;
			}
		}
		return { ok: true, value: JSON.stringify(current, null, indentSpace(indent)) };
	}

	function escapeJson(raw: string): ConvertResult {
		let inner: string;
		try {
			inner = JSON.stringify(JSON.parse(raw), null, indentSpace(indent));
		} catch {
			inner = raw;
		}
		return { ok: true, value: JSON.stringify(inner) };
	}

	const result = $derived.by((): ConvertResult => {
		if (!input.trim()) return { ok: true, value: '' };
		return mode === 'unescape' ? unescapeJson(input) : escapeJson(input);
	});

	const output = $derived(result.ok ? result.value : '');

	const stats = $derived.by(() => {
		const inBytes = new TextEncoder().encode(input).length;
		const outBytes = new TextEncoder().encode(output).length;
		return { inBytes, outBytes };
	});

	const summaryStats = $derived([
		{ label: 'Status', value: !input.trim() ? 'Empty' : result.ok ? 'Valid' : 'Invalid' },
		{ label: 'Input size', value: `${stats.inBytes} B` },
		{ label: 'Output size', value: `${stats.outBytes} B` }
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
		mode = 'unescape';
		input = JSON_STRING_ESCAPE_EXAMPLE;
	}

	function swap() {
		if (!result.ok || !output) return;
		const next = output;
		mode = mode === 'unescape' ? 'escape' : 'unescape';
		input = next;
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">JSON String Escaper</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Unescape a JSON-encoded string like <code>"[{"{"}\"a\":1{"}"}]"</code> into valid, readable JSON
		- or escape JSON back into a quoted string.
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
				onclick={() => (mode = 'unescape')}
				class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					mode === 'unescape' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Unescape
			</button>
			<button
				onclick={() => (mode = 'escape')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					mode === 'escape' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Escape
			</button>
		</div>

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

		<button
			onclick={swap}
			disabled={!output || !result.ok}
			class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
		>
			<ArrowLeftRight class="h-3.5 w-3.5" />
			Swap
		</button>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Input -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label
					for="json-string-input"
					class="font-mono text-xs uppercase tracking-wide text-fg-muted"
				>
					{mode === 'unescape' ? 'Escaped JSON string' : 'JSON'}
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
				id="json-string-input"
				bind:value={input}
				placeholder={mode === 'unescape'
					? '"{\\"hello\\":\\"world\\"}"'
					: '{ "hello": "world" }'}
				rows="20"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>

			{#if input.trim() && !result.ok}
				<p class="mt-2 flex items-start gap-1.5 text-xs text-red-400">
					<CircleX class="mt-0.5 h-3.5 w-3.5 shrink-0" />
					{result.error}
				</p>
			{:else if input.trim() && result.ok}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-accent">
					<CircleCheck class="h-3.5 w-3.5 shrink-0" />
					{mode === 'unescape' ? 'Unescaped successfully' : 'Escaped successfully'}
				</p>
			{/if}
		</div>

		<!-- Output -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label
					for="json-string-output"
					class="font-mono text-xs uppercase tracking-wide text-fg-muted"
				>
					{mode === 'unescape' ? 'JSON' : 'Escaped JSON string'}
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
				id="json-string-output"
				value={output}
				readonly
				placeholder="Result will appear here..."
				rows="20"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>
</section>
