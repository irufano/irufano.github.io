<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Base64 Encode/Decode — Tools — irufano';
	const description = 'Encode text to Base64 or decode Base64 back to text.';
	const canonicalUrl = `${SITE_URL}/tools/base64`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import { base64State, type Base64Mode } from '$lib/state/base64.svelte';

	let input = $state(base64State.input);
	let mode = $state<Base64Mode>(base64State.mode);
	let urlSafe = $state(base64State.urlSafe);
	let copied = $state(false);

	$effect(() => {
		base64State.input = input;
		base64State.mode = mode;
		base64State.urlSafe = urlSafe;
	});

	function toBase64(text: string): string {
		const bytes = new TextEncoder().encode(text);
		let binary = '';
		bytes.forEach((b) => (binary += String.fromCharCode(b)));
		let b64 = btoa(binary);
		if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		return b64;
	}

	function fromBase64(b64: string): string {
		let normalized = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
		const pad = normalized.length % 4;
		if (pad) normalized += '='.repeat(4 - pad);
		const binary = atob(normalized);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	}

	const result = $derived.by((): { ok: true; value: string } | { ok: false; error: string } => {
		if (!input) return { ok: true, value: '' };
		try {
			return { ok: true, value: mode === 'encode' ? toBase64(input) : fromBase64(input) };
		} catch {
			return { ok: false, error: 'Invalid Base64 input — check for stray characters or bad padding.' };
		}
	});

	const output = $derived(result.ok ? result.value : '');

	const stats = $derived.by(() => {
		const inBytes = new TextEncoder().encode(input).length;
		const outBytes = new TextEncoder().encode(output).length;
		return { inBytes, outBytes };
	});

	const summaryStats = $derived([
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
			// clipboard read denied or unavailable — ignore
		}
	}

	function swap() {
		const next = output;
		mode = mode === 'encode' ? 'decode' : 'encode';
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Base64 Encode/Decode</h1>
	<p class="mt-2 text-sm text-fg-muted">Convert text to Base64 or decode Base64 back to text.</p>

	<div class="mt-8 grid grid-cols-2 gap-3 sm:max-w-xs">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stat.value}</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Options -->
	<div class="mt-6 flex flex-wrap items-center gap-4">
		<div class="inline-flex rounded-none border border-border">
			<button
				onclick={() => (mode = 'encode')}
				class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					mode === 'encode' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Encode
			</button>
			<button
				onclick={() => (mode = 'decode')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					mode === 'decode' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Decode
			</button>
		</div>

		<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
			<input type="checkbox" bind:checked={urlSafe} class="cursor-pointer accent-accent" />
			URL-safe encoding
		</label>

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
				<label for="base64-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					{mode === 'encode' ? 'Text' : 'Base64'}
				</label>
				<div class="flex items-center gap-1">
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
				id="base64-input"
				bind:value={input}
				placeholder={mode === 'encode' ? 'Type or paste text here...' : 'Paste Base64 here...'}
				rows="16"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>

			{#if input && !result.ok}
				<p class="mt-2 flex items-start gap-1.5 text-xs text-red-400">
					<CircleX class="mt-0.5 h-3.5 w-3.5 shrink-0" />
					{result.error}
				</p>
			{/if}
		</div>

		<!-- Output -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="base64-output" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					{mode === 'encode' ? 'Base64' : 'Text'}
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
				id="base64-output"
				value={output}
				readonly
				placeholder="Result will appear here..."
				rows="16"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>
</section>
