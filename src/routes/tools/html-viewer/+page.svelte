<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'HTML Viewer — Tools — irufano';
	const description =
		'Write or paste HTML and see a live preview instantly. Build a page from scratch, then copy, download, or open it in a new tab.';
	const canonicalUrl = `${SITE_URL}/tools/html-viewer`;

	import { tick } from 'svelte';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import Download from 'lucide-svelte/icons/download';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Tablet from 'lucide-svelte/icons/tablet';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import Maximize2 from 'lucide-svelte/icons/maximize-2';
	import X from 'lucide-svelte/icons/x';
	import { htmlViewerState, HTML_STARTER, type ViewMode, type DeviceMode } from '$lib/state/html-viewer.svelte';

	const INDENT = '  ';

	let code = $state(htmlViewerState.code);
	let viewMode = $state<ViewMode>(htmlViewerState.viewMode);
	let deviceMode = $state<DeviceMode>(htmlViewerState.deviceMode);
	let copied = $state(false);
	let showModal = $state(false);

	$effect(() => {
		htmlViewerState.code = code;
		htmlViewerState.viewMode = viewMode;
		htmlViewerState.deviceMode = deviceMode;
	});

	// Debounce the preview so the iframe doesn't reload on every keystroke.
	let previewHtml = $state(htmlViewerState.code);
	$effect(() => {
		const next = code;
		const timer = setTimeout(() => {
			previewHtml = next;
		}, 300);
		return () => clearTimeout(timer);
	});

	const stats = $derived.by(() => {
		const characters = code.length;
		const lines = code ? code.split(/\r\n|\r|\n/).length : 0;
		const bytes = new TextEncoder().encode(code).length;
		const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
		return { characters, lines, size };
	});

	const summaryStats = $derived([
		{ label: 'Lines', value: stats.lines },
		{ label: 'Characters', value: stats.characters },
		{ label: 'Size', value: stats.size }
	]);

	const deviceWidth = $derived(
		deviceMode === 'mobile' ? 'max-w-[375px]' : deviceMode === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
	);

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
		code = HTML_STARTER;
	}

	function clearCode() {
		code = '';
	}

	function downloadCode() {
		if (!code) return;
		const blob = new Blob([code], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'page.html';
		a.click();
		URL.revokeObjectURL(url);
	}

	function openInNewTab() {
		if (!code) return;
		const blob = new Blob([code], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank', 'noopener,noreferrer');
		setTimeout(() => URL.revokeObjectURL(url), 60000);
	}

	function openModal() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (showModal && e.key === 'Escape') closeModal();
	}

	$effect(() => {
		if (!showModal) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

	// the modal needs to escape the section's normal document flow so it
	// can cover the full viewport regardless of where it's mounted
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
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

{#snippet deviceToggle()}
	<div class="inline-flex rounded-none border border-border">
		<button
			onclick={() => (deviceMode = 'full')}
			title="Full width"
			class={`cursor-pointer px-2.5 py-1.5 transition ${
				deviceMode === 'full' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
			}`}
		>
			<Monitor class="h-3.5 w-3.5" />
		</button>
		<button
			onclick={() => (deviceMode = 'tablet')}
			title="Tablet width"
			class={`cursor-pointer border-l border-border px-2.5 py-1.5 transition ${
				deviceMode === 'tablet' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
			}`}
		>
			<Tablet class="h-3.5 w-3.5" />
		</button>
		<button
			onclick={() => (deviceMode = 'mobile')}
			title="Mobile width"
			class={`cursor-pointer border-l border-border px-2.5 py-1.5 transition ${
				deviceMode === 'mobile' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
			}`}
		>
			<Smartphone class="h-3.5 w-3.5" />
		</button>
	</div>
{/snippet}

<section class="w-full px-4 py-10 sm:px-6">
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">HTML Viewer</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Write or paste HTML and see it rendered live. Start from scratch with a template, or bring your
		own markup.
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

		{#if viewMode !== 'code'}
			{@render deviceToggle()}
		{/if}

		<div class="ml-auto flex flex-wrap items-center gap-1">
			{#if viewMode !== 'code'}
				<button
					onclick={openModal}
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
				onclick={openInNewTab}
				disabled={!code}
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
			>
				<ExternalLink class="h-3.5 w-3.5" />
				Open
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
				<label for="html-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					HTML
				</label>
				<textarea
					id="html-input"
					bind:value={code}
					onkeydown={handleInputKeydown}
					placeholder="Type or paste your HTML here..."
					rows="20"
					spellcheck="false"
					class="mt-0	 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
				></textarea>
			</div>
		{/if}

		<!-- Preview -->
		{#if viewMode !== 'code'}
			<div>
				<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Preview</p>
				<div class={`mt-2 h-125 border border-border bg-white transition-all lg:h-150 ${deviceWidth} ${deviceMode !== 'full' ? 'mx-auto' : ''}`}>
					<iframe
						title="HTML preview"
						srcdoc={previewHtml}
						sandbox="allow-scripts allow-modals allow-forms allow-popups"
						referrerpolicy="no-referrer"
						class="h-full w-full border-0"
					></iframe>
				</div>
			</div>
		{/if}
	</div>
</section>

{#if showModal}
	<div
		use:portal
		class="fixed inset-0 z-100 flex flex-col bg-black/70 backdrop-blur-[2px]"
		role="dialog"
		aria-modal="true"
		aria-label="Fullscreen HTML preview"
		tabindex="-1"
	>
		<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg px-4 py-3 sm:px-6">
			<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Preview</p>
			<div class="flex items-center gap-3">
				{@render deviceToggle()}
				<button
					onclick={closeModal}
					title="Close"
					class="cursor-pointer border border-border p-1.5 text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>

		<div class="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
			<div class={`h-full w-full border border-border bg-white transition-all ${deviceWidth}`}>
				<iframe
					title="HTML preview fullscreen"
					srcdoc={previewHtml}
					sandbox="allow-scripts allow-modals allow-forms allow-popups"
					referrerpolicy="no-referrer"
					class="h-full w-full border-0"
				></iframe>
			</div>
		</div>
	</div>
{/if}
