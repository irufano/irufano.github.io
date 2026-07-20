<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Markdown Viewer — Tools — irufano';
	const description =
		'Write or paste Markdown and see it rendered live, with the same math, code highlighting, callouts, tables, and diagrams as a blog post on this site.';
	const canonicalUrl = `${SITE_URL}/tools/md-viewer`;

	import { tick } from 'svelte';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import Download from 'lucide-svelte/icons/download';
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	import X from 'lucide-svelte/icons/x';
	import { mdViewerState, MD_EXAMPLE, type ViewMode } from '$lib/state/md-viewer.svelte';
	import { renderMarkdown } from '$lib/markdown';
	import { renderMermaidBlocks } from '$lib/client/mermaid';
	import { getThemeMeta } from '$lib/theme.svelte';
	import MdViewerToc, { type MdTocItem } from '$lib/components/MdViewerToc.svelte';
	import '$lib/styles/post-content.css';

	const INDENT = '  ';

	let code = $state(mdViewerState.code);
	let viewMode = $state<ViewMode>(mdViewerState.viewMode);
	let copied = $state(false);
	let renderedHtml = $state('');
	let toc = $state<MdTocItem[]>([]);
	let renderError = $state<string | null>(null);
	let previewEl: HTMLElement | undefined = $state();
	let fullscreen = $state(false);

	function extractToc(root: HTMLElement): MdTocItem[] {
		const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6'));
		return headings
			.filter((heading) => heading.id)
			.map((heading) => {
				const clone = heading.cloneNode(true) as HTMLElement;
				clone.querySelector('.heading-anchor')?.remove();
				return {
					id: heading.id,
					text: clone.textContent?.trim() ?? '',
					html: clone.innerHTML,
					depth: Number(heading.tagName[1]) as 2 | 3 | 4 | 5 | 6
				};
			});
	}

	$effect(() => {
		mdViewerState.code = code;
		mdViewerState.viewMode = viewMode;
	});

	const stats = $derived.by(() => {
		const characters = code.length;
		const words = code.trim() ? code.trim().split(/\s+/).length : 0;
		const lines = code ? code.split(/\r\n|\r|\n/).length : 0;
		return { characters, words, lines };
	});

	const summaryStats = $derived([
		{ label: 'Lines', value: stats.lines },
		{ label: 'Words', value: stats.words },
		{ label: 'Characters', value: stats.characters }
	]);

	// Debounce rendering so the preview doesn't re-parse on every keystroke.
	let renderToken = 0;
	$effect(() => {
		const source = code;
		const timer = setTimeout(async () => {
			const token = ++renderToken;
			try {
				const result = await renderMarkdown(source);
				if (token !== renderToken) return;
				renderedHtml = result.html;
				renderError = null;
			} catch (err) {
				if (token !== renderToken) return;
				renderError = err instanceof Error ? err.message : 'Failed to render markdown.';
			}
		}, 300);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		void renderedHtml;
		// also re-render mermaid diagrams whenever the color theme group flips
		const group = getThemeMeta().group;
		void group;
		if (!previewEl) return;
		tick().then(async () => {
			if (!previewEl) return;
			await renderMermaidBlocks(previewEl);
			// rebuild after mermaid swaps its blocks' innerHTML, so the toc
			// never points at stale/removed heading nodes
			toc = extractToc(previewEl);
		});
	});

	function handlePreviewClick(event: MouseEvent) {
		const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('.copy-code-btn');
		if (!btn) return;
		const codeEl = btn.closest('.code-block')?.querySelector('code');
		if (!codeEl) return;
		navigator.clipboard.writeText(codeEl.textContent ?? '').then(() => {
			btn.dataset.copied = 'true';
			setTimeout(() => {
				delete btn.dataset.copied;
			}, 1500);
		});
	}

	$effect(() => {
		if (!previewEl) return;
		previewEl.addEventListener('click', handlePreviewClick);
		return () => previewEl?.removeEventListener('click', handlePreviewClick);
	});

	async function copyCode() {
		if (!code) return;
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	async function pasteCode() {
		try {
			code = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable — ignore
		}
	}

	function newFromScratch() {
		code = MD_EXAMPLE;
	}

	function clearCode() {
		code = '';
	}

	function openFullscreen() {
		fullscreen = true;
	}

	function closeFullscreen() {
		fullscreen = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (fullscreen && e.key === 'Escape') closeFullscreen();
	}

	$effect(() => {
		if (!fullscreen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

	function downloadCode() {
		if (!code) return;
		const blob = new Blob([code], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'document.md';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleInputKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		e.preventDefault();

		const textarea = e.currentTarget as HTMLTextAreaElement;
		const { selectionStart: start, selectionEnd: end, value } = textarea;

		if (start === end && !e.shiftKey) {
			code = value.slice(0, start) + INDENT + value.slice(end);
			await tick();
			textarea.selectionStart = textarea.selectionEnd = start + INDENT.length;
			return;
		}

		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const nextNewline = value.indexOf('\n', end - 1);
		const lineEnd = nextNewline === -1 ? value.length : nextNewline;
		const lines = value.slice(lineStart, lineEnd).split('\n');

		const newLines = e.shiftKey
			? lines.map((line) => {
					if (line.startsWith(INDENT)) return line.slice(INDENT.length);
					return line.replace(/^[ \t]/, '');
				})
			: lines.map((line) => INDENT + line);

		const newBlock = newLines.join('\n');
		code = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);

		await tick();
		textarea.selectionStart = lineStart;
		textarea.selectionEnd = lineStart + newBlock.length;
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

<svelte:window onkeydown={onWindowKeydown} />

<section class="w-full px-4 py-10 sm:px-6">
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Markdown Viewer</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Write or paste Markdown and see it rendered live — math, syntax-highlighted code, callouts,
		tables, and Mermaid diagrams, exactly like a post on this site.
	</p>

	<div class="mt-8 grid grid-cols-3 gap-3 sm:max-w-sm">
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
				onclick={() => (viewMode = 'code')}
				class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					viewMode === 'code' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Code
			</button>
			<button
				onclick={() => (viewMode = 'split')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					viewMode === 'split' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Split
			</button>
			<button
				onclick={() => (viewMode = 'preview')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					viewMode === 'preview' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Preview
			</button>
		</div>

		<div class="ml-auto flex flex-wrap items-center gap-1">
			{#if viewMode !== 'code'}
				<button
					onclick={openFullscreen}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<Maximize2 class="h-3.5 w-3.5" />
					Fullscreen
				</button>
			{/if}
			<button
				onclick={newFromScratch}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
			>
				<Wand2 class="h-3.5 w-3.5" />
				New
			</button>
			<button
				onclick={pasteCode}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
			>
				<Clipboard class="h-3.5 w-3.5" />
				Paste
			</button>
			<button
				onclick={copyCode}
				disabled={!code}
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
			<button
				onclick={downloadCode}
				disabled={!code}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
			>
				<Download class="h-3.5 w-3.5" />
				Download
			</button>
			<button
				onclick={clearCode}
				disabled={!code}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
			>
				<Trash2 class="h-3.5 w-3.5" />
				Clear
			</button>
		</div>
	</div>

	<div class={`mt-6 grid gap-6 ${viewMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
		<!-- Editor -->
		{#if viewMode !== 'preview'}
			<div>
				<label for="md-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Markdown
				</label>
				<textarea
					id="md-input"
					bind:value={code}
					onkeydown={handleInputKeydown}
					placeholder="Type or paste your Markdown here..."
					rows="20"
					spellcheck="false"
					class="mt-0 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
				></textarea>
			</div>
		{/if}

		<!-- Preview -->
		{#if viewMode !== 'code'}
			<div class="grid min-w-0 gap-6 xl:grid-cols-[1fr_200px]">
				<div class="min-w-0">
					<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Preview</p>
					<!-- `contents` makes each wrapper a layout no-op outside fullscreen, so
					     the header/toc stay siblings of previewEl instead of being crammed
					     inside its own scrolling content (which caused the overlap). The
					     backdrop + padded frame mirrors the HTML Viewer's fullscreen modal
					     instead of stretching the content edge-to-edge. -->
					<div
						class={fullscreen
							? 'fixed inset-0 z-100 flex flex-col bg-black/70 backdrop-blur-[2px]'
							: 'contents'}
					>
						{#if fullscreen}
							<div
								class="flex shrink-0 items-center justify-between border-b border-border bg-bg px-4 py-3 sm:px-6"
							>
								<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">
									Markdown Preview
								</p>
								<button
									onclick={closeFullscreen}
									title="Close (Esc)"
									class="cursor-pointer border border-border p-1.5 text-fg-muted transition hover:border-accent/50 hover:text-fg"
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						{/if}
						<div class={fullscreen ? 'flex min-h-0 flex-1 p-4 sm:p-6' : 'contents'}>
							<div
								class={fullscreen
									? 'flex min-h-0 flex-1 border border-border bg-bg max-w-6xl mx-auto'
									: 'contents'}
							>
								<div
									bind:this={previewEl}
									class={fullscreen
										? 'flex-1 overflow-y-auto p-4 sm:p-6'
										: 'prose mt-2 h-125 max-w-none overflow-y-auto border border-border bg-bg p-4 transition-all lg:h-150 sm:p-6'}
								>
									<!-- capped + centered so long lines stay readable in the wide
									     fullscreen frame; a no-op outside fullscreen since previewEl
									     itself already carries `prose max-w-none` there. The width cap
									     has to live on a non-`.prose` ancestor: post-content.css's
									     unlayered `.prose { max-width: none }` always beats a Tailwind
									     utility class on the same element, regardless of order. -->
									<div class={fullscreen ? 'mx-auto max-w-3xl' : 'contents'}>
										<div class={fullscreen ? 'prose' : 'contents'}>
											{#if renderError}
												<p class="not-prose text-sm text-red-400">{renderError}</p>
											{:else if code}
												{@html renderedHtml}
											{:else}
												<p class="not-prose text-sm text-fg-muted">Nothing to preview yet.</p>
											{/if}
										</div>
									</div>
								</div>
								{#if fullscreen && toc.length}
									<aside
										class="hidden w-56 shrink-0 overflow-y-auto border-l border-border p-4 lg:block"
									>
										<MdViewerToc items={toc} containerEl={previewEl} />
									</aside>
								{/if}
							</div>
						</div>
					</div>
				</div>
				{#if !fullscreen && toc.length}
					<aside class="hidden xl:block">
						<div class="sticky top-0 max-h-150 overflow-hidden">
							<MdViewerToc items={toc} containerEl={previewEl} />
						</div>
					</aside>
				{/if}
			</div>
		{/if}
	</div>
</section>
