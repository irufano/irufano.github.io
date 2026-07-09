<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Hash Generator — Tools — irufano';
	const description = 'Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text.';
	const canonicalUrl = `${SITE_URL}/tools/hash-generator`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import { hashGeneratorState } from '$lib/state/hash-generator.svelte';
	import { md5 } from '$lib/utils/md5';

	const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;

	let input = $state(hashGeneratorState.input);
	let results = $state<{ label: string; value: string }[]>([]);
	let copiedLabel = $state('');

	$effect(() => {
		hashGeneratorState.input = input;
	});

	async function digestHex(algorithm: string, data: Uint8Array): Promise<string> {
		const buffer = await crypto.subtle.digest(algorithm, data as BufferSource);
		return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	$effect(() => {
		const text = input;
		const timer = setTimeout(async () => {
			if (!text) {
				results = [];
				return;
			}
			const encoded = new TextEncoder().encode(text);
			const [sha1, sha256, sha384, sha512] = await Promise.all([
				digestHex('SHA-1', encoded),
				digestHex('SHA-256', encoded),
				digestHex('SHA-384', encoded),
				digestHex('SHA-512', encoded)
			]);
			results = [
				{ label: 'MD5', value: md5(text) },
				{ label: 'SHA-1', value: sha1 },
				{ label: 'SHA-256', value: sha256 },
				{ label: 'SHA-384', value: sha384 },
				{ label: 'SHA-512', value: sha512 }
			];
		}, 200);
		return () => clearTimeout(timer);
	});

	const stats = $derived.by(() => {
		const bytes = new TextEncoder().encode(input).length;
		const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
		return { size, algorithms: ALGORITHMS.length };
	});

	async function copyHash(label: string, value: string) {
		await navigator.clipboard.writeText(value);
		copiedLabel = label;
		setTimeout(() => (copiedLabel = ''), 1500);
	}

	async function pasteInput() {
		try {
			input = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable — ignore
		}
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Hash Generator</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Type or paste text to generate MD5 and SHA hashes instantly.
	</p>

	<div class="mt-8 grid grid-cols-2 gap-3 sm:max-w-xs">
		<div class="rounded-none border border-border bg-bg-alt p-3">
			<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stats.size}</p>
			<p class="mt-1 text-xs text-fg-muted">Input size</p>
		</div>
		<div class="rounded-none border border-border bg-bg-alt p-3">
			<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stats.algorithms}</p>
			<p class="mt-1 text-xs text-fg-muted">Algorithms</p>
		</div>
	</div>

	<div class="mt-6">
		<div class="flex items-center justify-between gap-2">
			<label for="hash-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				Text
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
			id="hash-input"
			bind:value={input}
			placeholder="Type or paste text here..."
			rows="8"
			spellcheck="false"
			class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
		></textarea>
	</div>

	<div class="mt-6 space-y-3">
		{#each ALGORITHMS as label (label)}
			{@const result = results.find((r) => r.label === label)}
			<div>
				<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">{label}</p>
				<div class="mt-2 flex items-stretch gap-1">
					<p
						class="w-full overflow-x-auto rounded-none border border-border bg-bg-alt p-3 font-mono text-sm break-all text-fg"
					>
						{result?.value ?? ''}
					</p>
					<button
						onclick={() => result && copyHash(label, result.value)}
						disabled={!result}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
					>
						{#if copiedLabel === label}
							<Check class="h-3.5 w-3.5 text-accent" />
						{:else}
							<Copy class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>
</section>
