<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Character Counter — Tools — irufano';
	const description = 'Count characters, words, sentences, lines, and paragraphs in your text.';
	const canonicalUrl = `${SITE_URL}/tools/character-counter`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import { characterCounterState } from '$lib/state/character-counter.svelte';

	let text = $state(characterCounterState.text);
	let copied = $state(false);

	$effect(() => {
		characterCounterState.text = text;
	});

	const stats = $derived.by(() => {
		const characters = text.length;
		const charactersNoSpaces = text.replace(/\s/g, '').length;
		const words = text.trim() ? (text.trim().match(/\S+/g)?.length ?? 0) : 0;
		const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+|\S+$/g)?.filter((s) => s.trim()).length ?? 0) : 0;
		const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
		const paragraphs = text.trim()
			? text
					.split(/\n\s*\n/)
					.map((p) => p.trim())
					.filter(Boolean).length
			: 0;
		const bytes = new TextEncoder().encode(text).length;
		const readingTime = Math.ceil(words / 200);

		return { characters, charactersNoSpaces, words, sentences, lines, paragraphs, bytes, readingTime };
	});

	const summaryStats = $derived([
		{ label: 'Characters', value: stats.characters },
		{ label: 'No spaces', value: stats.charactersNoSpaces },
		{ label: 'Words', value: stats.words },
		{ label: 'Sentences', value: stats.sentences },
		{ label: 'Lines', value: stats.lines },
		{ label: 'Paragraphs', value: stats.paragraphs },
		{ label: 'Bytes (UTF-8)', value: stats.bytes },
		{ label: 'Reading time', value: text.trim() ? `${stats.readingTime} min` : '0 min' }
	]);

	async function copyText() {
		if (!text) return;
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	async function pasteText() {
		try {
			text = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable — ignore
		}
	}

	function clearText() {
		text = '';
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Character Counter</h1>
	<p class="mt-2 text-sm text-fg-muted">Count characters, words, and lines in your text.</p>

	<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stat.value}</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<div class="mt-6">
		<div class="flex items-center justify-between gap-2">
			<label for="text-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				Your text
			</label>
			<div class="flex items-center gap-1">
				<button
					onclick={pasteText}
					class="flex items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<Clipboard class="h-3.5 w-3.5" />
					Paste
				</button>
				<button
					onclick={copyText}
					disabled={!text}
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
				<button
					onclick={clearText}
					disabled={!text}
					class="flex items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
				>
					<Trash2 class="h-3.5 w-3.5" />
					Clear
				</button>
			</div>
		</div>

		<textarea
			id="text-input"
			bind:value={text}
			placeholder="Start typing or paste your text here..."
			rows="14"
			class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
		></textarea>
	</div>
</section>
