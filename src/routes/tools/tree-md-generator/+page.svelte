<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Tree MD Generator - Tools - irufano';
	const description =
		'Turn an indented list of folders and files into an ASCII tree or markdown list, ready to paste into a README.';
	const canonicalUrl = `${SITE_URL}/tools/tree-md-generator`;

	import { tick } from 'svelte';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import {
		treeMdGeneratorState,
		TREE_EXAMPLE,
		type TreeFormat,
		type TreeSortMode
	} from '$lib/state/tree-md-generator.svelte';

	const INDENT = '    ';

	type TreeNode = {
		name: string;
		isDir: boolean;
		children: TreeNode[];
	};

	type Format = TreeFormat;
	type SortMode = TreeSortMode;

	const EXAMPLE = TREE_EXAMPLE;

	let input = $state(treeMdGeneratorState.input);
	let format = $state<Format>(treeMdGeneratorState.format);
	let sortMode = $state<SortMode>(treeMdGeneratorState.sortMode);
	let trailingSlash = $state(treeMdGeneratorState.trailingSlash);
	let wrapFence = $state(treeMdGeneratorState.wrapFence);
	let copied = $state(false);

	$effect(() => {
		treeMdGeneratorState.input = input;
		treeMdGeneratorState.format = format;
		treeMdGeneratorState.sortMode = sortMode;
		treeMdGeneratorState.trailingSlash = trailingSlash;
		treeMdGeneratorState.wrapFence = wrapFence;
	});

	function measureIndent(line: string): number {
		const match = line.match(/^[ \t]*/);
		return match ? match[0].replace(/\t/g, '    ').length : 0;
	}

	function parseInput(text: string): TreeNode[] {
		const root: TreeNode[] = [];
		const stack: { indent: number; node: TreeNode }[] = [];

		for (const rawLine of text.split(/\r\n|\r|\n/)) {
			if (!rawLine.trim()) continue;

			const indent = measureIndent(rawLine);
			let content = rawLine.trim();

			content = content.replace(/^[+*-]\s*/, '');

			let explicitDir: boolean | null = null;
			const typeMatch = content.match(/^(dir|folder|file)\s+/i);
			if (typeMatch) {
				explicitDir = !/file/i.test(typeMatch[1]);
				content = content.slice(typeMatch[0].length);
			}

			let name = content.trim();
			if (!name) continue;

			const isDir = explicitDir ?? /\/$/.test(name);
			name = name.replace(/\/+$/, '');

			const node: TreeNode = { name, isDir, children: [] };

			while (stack.length && stack[stack.length - 1].indent >= indent) {
				stack.pop();
			}

			if (stack.length === 0) {
				root.push(node);
			} else {
				const parent = stack[stack.length - 1].node;
				parent.isDir = true;
				parent.children.push(node);
			}

			stack.push({ indent, node });
		}

		return root;
	}

	function sortTree(nodes: TreeNode[], mode: SortMode): TreeNode[] {
		let sorted = nodes;
		if (mode === 'alpha') {
			sorted = [...nodes].sort((a, b) => a.name.localeCompare(b.name));
		} else if (mode === 'dirs-first') {
			sorted = [...nodes].sort((a, b) => {
				if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
				return a.name.localeCompare(b.name);
			});
		}
		return sorted.map((node) => ({ ...node, children: sortTree(node.children, mode) }));
	}

	function renderAscii(nodes: TreeNode[], prefix = ''): string {
		let out = '';
		nodes.forEach((node, i) => {
			const isLast = i === nodes.length - 1;
			const connector = isLast ? '└── ' : '├── ';
			const suffix = node.isDir && trailingSlash ? '/' : '';
			out += `${prefix}${connector}${node.name}${suffix}\n`;
			if (node.children.length) {
				out += renderAscii(node.children, prefix + (isLast ? '    ' : '│   '));
			}
		});
		return out;
	}

	function renderMarkdown(nodes: TreeNode[], depth = 0): string {
		let out = '';
		for (const node of nodes) {
			const suffix = node.isDir && trailingSlash ? '/' : '';
			out += `${'  '.repeat(depth)}- ${node.name}${suffix}\n`;
			out += renderMarkdown(node.children, depth + 1);
		}
		return out;
	}

	function countStats(nodes: TreeNode[]): { folders: number; files: number; depth: number } {
		let folders = 0;
		let files = 0;
		let depth = 0;

		function walk(list: TreeNode[], level: number) {
			depth = Math.max(depth, level);
			for (const node of list) {
				if (node.isDir) folders++;
				else files++;
				if (node.children.length) walk(node.children, level + 1);
			}
		}

		walk(nodes, 1);
		return { folders, files, depth };
	}

	const parsedTree = $derived.by(() => parseInput(input));
	const sortedTree = $derived.by(() => sortTree(parsedTree, sortMode));
	const stats = $derived.by(() => countStats(parsedTree));

	const treeBody = $derived.by(() => {
		if (format === 'markdown') return renderMarkdown(sortedTree);

		if (sortedTree.length === 1) {
			const root = sortedTree[0];
			const suffix = root.isDir && trailingSlash ? '/' : '';
			return `${root.name}${suffix}\n${renderAscii(root.children)}`;
		}

		return renderAscii(sortedTree);
	});

	const output = $derived(
		format === 'ascii' && wrapFence && treeBody ? '```\n' + treeBody + '```' : treeBody
	);

	const summaryStats = $derived([
		{ label: 'Folders', value: stats.folders },
		{ label: 'Files', value: stats.files },
		{ label: 'Max depth', value: stats.depth }
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
		input = EXAMPLE;
	}

	function clearInput() {
		input = '';
	}

	async function handleInputKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		e.preventDefault();

		const textarea = e.currentTarget as HTMLTextAreaElement;
		const { selectionStart: start, selectionEnd: end, value } = textarea;

		if (start === end && !e.shiftKey) {
			input = value.slice(0, start) + INDENT + value.slice(end);
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
		input = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);

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

<section class="w-full px-4 py-10 sm:px-6">
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Tree MD Generator</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Paste an indented list of folders and files and get a clean ASCII tree or markdown list you can
		drop straight into a README.
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
		<div class="inline-flex rounded-none border border-border">
			<button
				onclick={() => (format = 'ascii')}
				class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					format === 'ascii' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				ASCII tree
			</button>
			<button
				onclick={() => (format = 'markdown')}
				class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					format === 'markdown' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				Markdown list
			</button>
		</div>

		<div class="flex items-center gap-2">
			<label for="sort-mode" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				Sort
			</label>
			<div class="relative">
				<select
					id="sort-mode"
					bind:value={sortMode}
					class="cursor-pointer appearance-none rounded-none border border-border bg-bg-alt py-1.5 pl-2 pr-7 text-xs text-fg focus:border-accent focus:outline-none"
				>
					<option value="none">As entered</option>
					<option value="alpha">A → Z</option>
					<option value="dirs-first">Folders first</option>
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

		<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
			<input type="checkbox" bind:checked={trailingSlash} class="cursor-pointer accent-accent" />
			Trailing slash on folders
		</label>

		{#if format === 'ascii'}
			<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
				<input type="checkbox" bind:checked={wrapFence} class="cursor-pointer accent-accent" />
				Wrap in code fence
			</label>
		{/if}
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<!-- Input -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="tree-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Input
				</label>
				<div class="flex items-center gap-1">
					<button
						onclick={loadExample}
						class="flex items-center cursor-pointer gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						<Wand2 class="h-3.5 w-3.5" />
						Example
					</button>
					<button
						onclick={pasteInput}
						class="flex items-center cursor-pointer gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						<Clipboard class="h-3.5 w-3.5" />
						Paste
					</button>
					<button
						onclick={clearInput}
						disabled={!input}
						class="flex items-center cursor-pointer gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
					>
						<Trash2 class="h-3.5 w-3.5" />
						Clear
					</button>
				</div>
			</div>

			<textarea
				id="tree-input"
				bind:value={input}
				onkeydown={handleInputKeydown}
				placeholder={'+ dir parent\n    + dir child\n       + children\n+ dir other'}
				rows="16"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>

			<p class="mt-2 text-xs text-fg-muted">
				Use indentation to nest items. Prefix a line with <code class="text-fg">dir</code> (or add a
				trailing <code class="text-fg">/</code>) to mark it as a folder - everything else is treated
				as a file. Bullets like <code class="text-fg">+</code>, <code class="text-fg">-</code>, or
				<code class="text-fg">*</code> are optional.
			</p>
		</div>

		<!-- Output -->
		<div>
			<div class="flex items-center justify-between gap-2">
				<label for="tree-output" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Output
				</label>
				<button
					onclick={copyOutput}
					disabled={!output}
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

			<textarea
				id="tree-output"
				value={output}
				readonly
				placeholder="Tree will appear here..."
				rows="16"
				spellcheck="false"
				class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			></textarea>
		</div>
	</div>
</section>
