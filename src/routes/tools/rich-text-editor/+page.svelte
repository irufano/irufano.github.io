<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Rich Text Editor — Tools — irufano';
	const description = 'Format text visually with a WYSIWYG editor and copy the generated HTML.';
	const canonicalUrl = `${SITE_URL}/tools/rich-text-editor`;

	import { untrack } from 'svelte';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Bold from 'lucide-svelte/icons/bold';
	import Italic from 'lucide-svelte/icons/italic';
	import Underline from 'lucide-svelte/icons/underline';
	import Strikethrough from 'lucide-svelte/icons/strikethrough';
	import Heading1 from 'lucide-svelte/icons/heading-1';
	import Heading2 from 'lucide-svelte/icons/heading-2';
	import List from 'lucide-svelte/icons/list';
	import ListOrdered from 'lucide-svelte/icons/list-ordered';
	import Link2 from 'lucide-svelte/icons/link-2';
	import Quote from 'lucide-svelte/icons/quote';
	import RemoveFormatting from 'lucide-svelte/icons/remove-formatting';
	import '$lib/styles/post-content.css';
	import { richTextEditorState } from '$lib/state/rich-text-editor.svelte';

	let html = $state(richTextEditorState.html);
	let editorEl = $state<HTMLDivElement>();
	let copied = $state(false);

	$effect(() => {
		richTextEditorState.html = html;
	});

	// Load any persisted content into the contenteditable once, when it first
	// mounts — not on every keystroke, or the cursor would jump to the start.
	$effect(() => {
		if (!editorEl) return;
		const el = editorEl;
		untrack(() => {
			el.innerHTML = html;
		});
	});

	const stats = $derived.by(() => {
		const text = html
			.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		const characters = text.length;
		const words = text ? (text.match(/\S+/g)?.length ?? 0) : 0;
		const bytes = new TextEncoder().encode(html).length;
		const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
		return { characters, words, size };
	});

	const summaryStats = $derived([
		{ label: 'Words', value: stats.words },
		{ label: 'Characters', value: stats.characters },
		{ label: 'Size', value: stats.size }
	]);

	// Strips anything that could execute or style outside the editor —
	// scripts, styles, event-handler attributes, javascript: URLs — so pasted
	// content from elsewhere can't affect the page or run unexpected code.
	function sanitizeHtml(dirty: string): string {
		const doc = new DOMParser().parseFromString(dirty, 'text/html');
		doc.querySelectorAll('script, style, link, meta, iframe, object, embed, form, noscript').forEach((el) =>
			el.remove()
		);
		doc.querySelectorAll('*').forEach((el) => {
			for (const attr of [...el.attributes]) {
				if (/^on/i.test(attr.name)) {
					el.removeAttribute(attr.name);
				} else if ((attr.name === 'href' || attr.name === 'src') && /^\s*javascript:/i.test(attr.value)) {
					el.removeAttribute(attr.name);
				}
			}
		});
		return doc.body?.innerHTML ?? '';
	}

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	function syncFromEditor() {
		if (!editorEl) return;
		html = editorEl.innerHTML;
	}

	function exec(command: string, value?: string) {
		editorEl?.focus();
		document.execCommand(command, false, value);
		syncFromEditor();
	}

	function execLink() {
		const url = window.prompt('Link URL');
		if (!url) return;
		exec('createLink', url);
	}

	function handleInput() {
		syncFromEditor();
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const htmlData = e.clipboardData?.getData('text/html');
		const textData = e.clipboardData?.getData('text/plain') ?? '';
		const clean = htmlData ? sanitizeHtml(htmlData) : escapeHtml(textData).replace(/\n/g, '<br>');
		document.execCommand('insertHTML', false, clean);
		syncFromEditor();
	}

	function clearEditor() {
		html = '';
		if (editorEl) editorEl.innerHTML = '';
	}

	async function copyHtml() {
		if (!html) return;
		await navigator.clipboard.writeText(html);
		copied = true;
		setTimeout(() => (copied = false), 1500);
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Rich Text Editor</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Format text visually — bold, headings, lists, links — and copy the HTML it generates.
	</p>

	<div class="mt-8 grid grid-cols-3 gap-3 sm:max-w-sm">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stat.value}</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex items-center justify-end gap-1">
		<button
			onclick={copyHtml}
			disabled={!html}
			class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
		>
			{#if copied}
				<Check class="h-3.5 w-3.5 text-accent" />
				Copied
			{:else}
				<Copy class="h-3.5 w-3.5" />
				Copy HTML
			{/if}
		</button>
		<button
			onclick={clearEditor}
			disabled={!html}
			class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
		>
			<Trash2 class="h-3.5 w-3.5" />
			Clear
		</button>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Editor -->
		<div>
			<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Editor</p>
			<div class="mt-2 flex h-125 flex-col border border-border bg-bg-alt lg:h-150">
				<div class="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
					<button
						type="button"
						onclick={() => exec('bold')}
						title="Bold"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Bold class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={() => exec('italic')}
						title="Italic"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Italic class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={() => exec('underline')}
						title="Underline"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Underline class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={() => exec('strikeThrough')}
						title="Strikethrough"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Strikethrough class="h-3.5 w-3.5" />
					</button>

					<span class="mx-1 h-4 w-px bg-border"></span>

					<button
						type="button"
						onclick={() => exec('formatBlock', 'h1')}
						title="Heading 1"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Heading1 class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={() => exec('formatBlock', 'h2')}
						title="Heading 2"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Heading2 class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={() => exec('formatBlock', 'blockquote')}
						title="Quote"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Quote class="h-3.5 w-3.5" />
					</button>

					<span class="mx-1 h-4 w-px bg-border"></span>

					<button
						type="button"
						onclick={() => exec('insertUnorderedList')}
						title="Bullet list"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<List class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={() => exec('insertOrderedList')}
						title="Numbered list"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<ListOrdered class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onclick={execLink}
						title="Link"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<Link2 class="h-3.5 w-3.5" />
					</button>

					<span class="mx-1 h-4 w-px bg-border"></span>

					<button
						type="button"
						onclick={() => exec('removeFormat')}
						title="Clear formatting"
						class="cursor-pointer p-1.5 text-fg-muted transition hover:bg-bg hover:text-fg"
					>
						<RemoveFormatting class="h-3.5 w-3.5" />
					</button>
				</div>
				<div
					bind:this={editorEl}
					oninput={handleInput}
					onpaste={handlePaste}
					contenteditable="true"
					role="textbox"
					aria-multiline="true"
					aria-label="Rich text editor"
					data-placeholder="Start typing..."
					class="prose prose-sm max-w-none flex-1 overflow-y-auto p-4 text-sm text-fg focus:outline-none empty:before:pointer-events-none empty:before:text-fg-muted empty:before:content-[attr(data-placeholder)]"
				></div>
			</div>
		</div>

		<!-- HTML output -->
		<div>
			<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">HTML output</p>
			<textarea
				value={html}
				readonly
				placeholder="HTML will appear here..."
				spellcheck="false"
				class="mt-2 h-125 w-full resize-none rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none lg:h-150"
			></textarea>
		</div>
	</div>
</section>
