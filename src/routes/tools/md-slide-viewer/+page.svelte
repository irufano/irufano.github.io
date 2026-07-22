<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'MD Slide Viewer - Tools - irufano';
	const description =
		'Write Markdown slides separated by ---, then present them as a live slideshow with fullscreen presenting and keyboard navigation.';
	const canonicalUrl = `${SITE_URL}/tools/md-slide-viewer`;

	import { tick } from 'svelte';
	import { scale } from 'svelte/transition';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import Download from 'lucide-svelte/icons/download';
	import Presentation from 'lucide-svelte/icons/presentation';
	import Timer from 'lucide-svelte/icons/timer';
	import Music from 'lucide-svelte/icons/music';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import X from 'lucide-svelte/icons/x';
	import type { PageData } from './$types';
	import {
		slideViewerState,
		SLIDE_EXAMPLE,
		SLIDE_THEMES,
		MIN_COUNTDOWN_SECONDS,
		MAX_COUNTDOWN_SECONDS,
		DEFAULT_COUNTDOWN_SECONDS,
		COUNTDOWN_POSITIONS,
		COUNTDOWN_FONTS,
		COUNTDOWN_VISUALIZER_STYLES,
		COUNTDOWN_BG_ANIMATION_STYLES,
		splitSlides,
		extractYouTubeId,
		extractYouTubeStart,
		oppositeCountdownPosition,
		saveSlideViewerState,
		type SlideTheme,
		type ViewMode,
		type CountdownStyle,
		type CountdownPosition,
		type CountdownVisualizerStyle,
		type CountdownBgAnimationStyle
	} from '$lib/state/slide-viewer.svelte';
	import { renderMarkdown } from '$lib/markdown';
	import { renderMermaidBlocks } from '$lib/client/mermaid';
	import { getThemeMeta } from '$lib/theme.svelte';
	import { formatDate } from '$lib/utils/date';
	import '$lib/styles/post-content.css';

	let { data }: { data: PageData } = $props();

	const INDENT = '  ';

	const COUNTDOWN_POSITION_CLASSES: Record<CountdownPosition, string> = {
		'top-left': 'items-start justify-start',
		top: 'items-center justify-start',
		'top-right': 'items-end justify-start',
		left: 'items-start justify-center',
		center: 'items-center justify-center',
		right: 'items-end justify-center',
		'bottom-left': 'items-start justify-end',
		bottom: 'items-center justify-end',
		'bottom-right': 'items-end justify-end'
	};

	let code = $state(slideViewerState.code);
	let viewMode = $state<ViewMode>(slideViewerState.viewMode);
	let currentSlide = $state(slideViewerState.currentSlide);
	let slideTheme = $state(slideViewerState.theme);
	let copied = $state(false);
	let renderedHtml = $state('');
	let renderError = $state<string | null>(null);
	let previewEl: HTMLElement | undefined = $state();
	let present = $state(false);
	let settingsOpen = $state(false);
	let blogPickerOpen = $state(false);
	let blogPickerLoadingSlug = $state<string | null>(null);
	let blogPickerError = $state<string | null>(null);
	let blogSearchQuery = $state('');
	let blogPage = $state(0);
	const BLOG_PAGE_SIZE = 6;
	let countdownEnabled = $state(slideViewerState.countdownEnabled);
	const initialDuration = secondsToHMS(slideViewerState.countdownSeconds);
	let countdownHours = $state(initialDuration.h);
	let countdownMinutes = $state(initialDuration.m);
	let countdownSecondsPart = $state(initialDuration.s);
	let countdownStyle = $state<CountdownStyle>(slideViewerState.countdownStyle);
	let countdownPosition = $state<CountdownPosition>(slideViewerState.countdownPosition);
	let countdownFont = $state(slideViewerState.countdownFont);
	let countdownMusicEnabled = $state(slideViewerState.countdownMusicEnabled);
	let countdownMusicUrl = $state(slideViewerState.countdownMusicUrl);
	let countdownVisualizerEnabled = $state(slideViewerState.countdownVisualizerEnabled);
	let countdownVisualizerStyle = $state<CountdownVisualizerStyle>(
		slideViewerState.countdownVisualizerStyle
	);
	let countdownVisualizerPosition = $state<CountdownPosition>(
		slideViewerState.countdownVisualizerPosition
	);
	let countdownBgAnimationEnabled = $state(slideViewerState.countdownBgAnimationEnabled);
	let countdownBgAnimationStyle = $state<CountdownBgAnimationStyle>(
		slideViewerState.countdownBgAnimationStyle
	);
	let counting = $state(false);
	let countdownValue = $state(0);

	const slides = $derived(splitSlides(code));
	const activeTheme = $derived(
		SLIDE_THEMES.find((t) => t.id === slideTheme) ?? SLIDE_THEMES[0]
	);
	const countdownFontValue = $derived(
		COUNTDOWN_FONTS.find((f) => f.id === countdownFont)?.value ?? COUNTDOWN_FONTS[0].value
	);
	// total seconds derived from the H/M/S fields, clamped to a sane range
	const countdownSeconds = $derived.by(() => {
		const total = countdownHours * 3600 + countdownMinutes * 60 + countdownSecondsPart;
		if (!Number.isFinite(total)) return DEFAULT_COUNTDOWN_SECONDS;
		return Math.min(MAX_COUNTDOWN_SECONDS, Math.max(MIN_COUNTDOWN_SECONDS, Math.round(total)));
	});
	const countdownDisplayParts = $derived(countdownParts(countdownValue, countdownStyle));
	// horizontal alignment of the "Starting in" text, timer, and buttons
	// follows the left/center/right of the chosen position - left-* positions
	// align left, right-* positions align right, everything else stays centered.
	const countdownAlignClass = $derived(
		countdownPosition.includes('left')
			? 'items-start text-left'
			: countdownPosition.includes('right')
				? 'items-end text-right'
				: 'items-center text-center'
	);
	const countdownMusicVideoId = $derived(extractYouTubeId(countdownMusicUrl));
	// null: field empty, so no error shown; false: non-empty but unparseable
	const countdownMusicUrlValid = $derived(
		countdownMusicUrl.trim() === '' ? null : countdownMusicVideoId !== null
	);
	// Origin is required by the YouTube embed API for postMessage-based control;
	// only available in the browser, so this stays empty during SSR/prerender.
	const countdownMusicSrc = $derived.by(() => {
		if (!countdownMusicVideoId) return '';
		const start = extractYouTubeStart(countdownMusicUrl);
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		const params = new URLSearchParams({
			autoplay: '1',
			mute: '0',
			controls: '0',
			disablekb: '1',
			modestbranding: '1',
			rel: '0',
			playsinline: '1',
			loop: '1',
			playlist: countdownMusicVideoId,
			origin
		});
		if (start > 0) params.set('start', String(start));
		return `https://www.youtube.com/embed/${countdownMusicVideoId}?${params.toString()}`;
	});
	// the chosen visualizer position wins unless the timer just moved onto
	// it, in which case it falls back to the opposite slot so the two never
	// overlap - the settings UI also disables picking the timer's own slot
	const visualizerDisplayPosition = $derived(
		countdownVisualizerPosition === countdownPosition
			? oppositeCountdownPosition(countdownPosition)
			: countdownVisualizerPosition
	);
	const countdownMusicActive = $derived(countdownMusicEnabled && !!countdownMusicSrc);

	$effect(() => {
		slideViewerState.code = code;
		slideViewerState.viewMode = viewMode;
		slideViewerState.theme = slideTheme;
		slideViewerState.countdownEnabled = countdownEnabled;
		slideViewerState.countdownSeconds = countdownSeconds;
		slideViewerState.countdownStyle = countdownStyle;
		slideViewerState.countdownPosition = countdownPosition;
		slideViewerState.countdownFont = countdownFont;
		slideViewerState.countdownMusicEnabled = countdownMusicEnabled;
		slideViewerState.countdownMusicUrl = countdownMusicUrl;
		slideViewerState.countdownVisualizerEnabled = countdownVisualizerEnabled;
		slideViewerState.countdownVisualizerStyle = countdownVisualizerStyle;
		slideViewerState.countdownVisualizerPosition = countdownVisualizerPosition;
		slideViewerState.countdownBgAnimationEnabled = countdownBgAnimationEnabled;
		slideViewerState.countdownBgAnimationStyle = countdownBgAnimationStyle;
		saveSlideViewerState();
	});

	// counts countdownValue down to 0 once per second while `counting` is
	// true; the effect's own cleanup clears the pending timer whenever
	// countdownValue/counting changes or the component unmounts.
	// `value` must be read synchronously (not just inside the setTimeout
	// callback) so Svelte tracks countdownValue as a dependency and reruns
	// this effect - and reschedules the next tick - on every decrement.
	$effect(() => {
		if (!counting) return;
		const value = countdownValue;
		const timer = setTimeout(() => {
			if (value <= 1) {
				counting = false;
				present = true;
			} else {
				countdownValue -= 1;
			}
		}, 1000);
		return () => clearTimeout(timer);
	});

	// keep currentSlide in range whenever the slide count changes
	$effect(() => {
		const total = slides.length;
		if (currentSlide > total - 1) currentSlide = total - 1;
		if (currentSlide < 0) currentSlide = 0;
		slideViewerState.currentSlide = currentSlide;
		saveSlideViewerState();
	});

	// data.posts filtered by the picker's search query (matches title or
	// category), still newest-first as returned by getAllPosts()
	const filteredBlogPosts = $derived.by(() => {
		const query = blogSearchQuery.trim().toLowerCase();
		if (!query) return data.posts;
		return data.posts.filter(
			(post) =>
				post.title.toLowerCase().includes(query) || post.category.toLowerCase().includes(query)
		);
	});

	const blogTotalPages = $derived(
		Math.max(1, Math.ceil(filteredBlogPosts.length / BLOG_PAGE_SIZE))
	);
	// clamps without writing to blogPage itself, so a stale page from a
	// narrower search doesn't get "stuck" once results widen again
	const blogCurrentPage = $derived(Math.min(blogPage, blogTotalPages - 1));

	// current page's posts, grouped by category in the order they appear
	const postsByCategory = $derived.by(() => {
		const start = blogCurrentPage * BLOG_PAGE_SIZE;
		const pagePosts = filteredBlogPosts.slice(start, start + BLOG_PAGE_SIZE);

		const groups = new Map<string, PageData['posts']>();
		for (const post of pagePosts) {
			const existing = groups.get(post.category);
			if (existing) existing.push(post);
			else groups.set(post.category, [post]);
		}
		return [...groups.entries()];
	});

	const stats = $derived.by(() => {
		const characters = code.length;
		const words = code.trim() ? code.trim().split(/\s+/).length : 0;
		return { slides: slides.length, words, characters };
	});

	const summaryStats = $derived([
		{ label: 'Slides', value: stats.slides },
		{ label: 'Words', value: stats.words },
		{ label: 'Characters', value: stats.characters }
	]);

	// Debounce rendering of the current slide so the preview doesn't re-parse on every keystroke.
	let renderToken = 0;
	$effect(() => {
		const source = slides[currentSlide] ?? '';
		const timer = setTimeout(async () => {
			const token = ++renderToken;
			try {
				const result = await renderMarkdown(source);
				if (token !== renderToken) return;
				renderedHtml = result.html;
				renderError = null;
			} catch (err) {
				if (token !== renderToken) return;
				renderError = err instanceof Error ? err.message : 'Failed to render slide.';
			}
		}, 200);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		void renderedHtml;
		// also re-render mermaid diagrams whenever the color theme group flips
		const group = getThemeMeta().group;
		void group;
		if (!previewEl) return;
		tick().then(() => {
			if (previewEl) renderMermaidBlocks(previewEl);
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

	function goPrev() {
		if (currentSlide > 0) currentSlide -= 1;
	}

	function goNext() {
		if (currentSlide < slides.length - 1) currentSlide += 1;
	}

	function goTo(index: number) {
		currentSlide = index;
	}

	async function copyCode() {
		if (!code) return;
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	async function pasteCode() {
		try {
			code = await navigator.clipboard.readText();
			currentSlide = 0;
		} catch {
			// clipboard read denied or unavailable - ignore
		}
	}

	function newFromScratch() {
		code = SLIDE_EXAMPLE;
		currentSlide = 0;
	}

	function clearCode() {
		code = '';
		currentSlide = 0;
	}

	function downloadCode() {
		if (!code) return;
		const blob = new Blob([code], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'slides.md';
		a.click();
		URL.revokeObjectURL(url);
	}

	function openPresent() {
		if (countdownEnabled && Number.isFinite(countdownSeconds) && countdownSeconds > 0) {
			countdownValue = countdownSeconds;
			counting = true;
		} else {
			present = true;
		}
	}

	function cancelCountdown() {
		counting = false;
	}

	function skipCountdown() {
		counting = false;
		present = true;
	}

	function closePresent() {
		present = false;
	}

	function openSettings() {
		settingsOpen = true;
	}

	function closeSettings() {
		settingsOpen = false;
	}

	function openBlogPicker() {
		blogPickerError = null;
		blogSearchQuery = '';
		blogPage = 0;
		blogPickerOpen = true;
	}

	function closeBlogPicker() {
		blogPickerOpen = false;
	}

	// jump back to the first page whenever the search narrows/widens the results
	$effect(() => {
		void blogSearchQuery;
		blogPage = 0;
	});

	async function loadFromBlogPost(post: PageData['posts'][number]) {
		blogPickerError = null;
		blogPickerLoadingSlug = post.slug;
		try {
			const res = await fetch(`/posts-raw/${post.categorySlug}/${post.slug}`);
			if (!res.ok) throw new Error(`Request failed (${res.status})`);
			code = await res.text();
			currentSlide = 0;
			blogPickerOpen = false;
		} catch {
			blogPickerError = 'Could not load that post. Please try again.';
		} finally {
			blogPickerLoadingSlug = null;
		}
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (settingsOpen) {
			if (e.key === 'Escape') closeSettings();
			return;
		}
		if (blogPickerOpen) {
			if (e.key === 'Escape') closeBlogPicker();
			return;
		}
		if (counting) {
			if (e.key === 'Escape') cancelCountdown();
			else if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				skipCountdown();
			}
			return;
		}
		if (!present) return;
		if (e.key === 'Escape') {
			closePresent();
		} else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
			e.preventDefault();
			goNext();
		} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
			e.preventDefault();
			goPrev();
		}
	}

	$effect(() => {
		if (!present && !counting && !settingsOpen && !blogPickerOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

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

	// Deterministic pseudo-random in [0, 1) from an integer seed. A plain
	// linear formula (seed * constant % range) still varies smoothly from
	// one seed to the next, which shows up as a visible diagonal sweep once
	// the seed is a grid cell's raster index - this scrambles that
	// correlation so neighboring cells get unrelated-looking values.
	function pseudoRandom(seed: number): number {
		const x = Math.sin(seed * 12.9898) * 43758.5453;
		return x - Math.floor(x);
	}

	// The "Default" theme intentionally emits no overrides, so the slide
	// surface falls back to the site's own ambient --color-* variables.
	function slideThemeStyle(theme: SlideTheme): string {
		if (theme.id === 'default') return '';
		return (
			`--slide-surface-bg:${theme.surfaceBackground}; ` +
			`--slide-bg:${theme.bg}; ` +
			`--slide-fg:${theme.fg}; ` +
			`--slide-heading:${theme.heading}; ` +
			`--slide-accent:${theme.accent}; ` +
			`--slide-font:${theme.font};`
		);
	}

	function slideLabel(slide: string, index: number): string {
		const firstLine = slide
			.split('\n')
			.map((l) => l.trim())
			.find((l) => l.length > 0);
		if (!firstLine) return `Slide ${index + 1}`;
		const stripped = firstLine.replace(/^#+\s*/, '').replace(/[*_`]/g, '');
		return stripped || `Slide ${index + 1}`;
	}

	function secondsToHMS(total: number): { h: number; m: number; s: number } {
		const clamped = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
		return {
			h: Math.floor(clamped / 3600),
			m: Math.floor((clamped % 3600) / 60),
			s: clamped % 60
		};
	}

	function clampField(value: number, max: number): number {
		if (!Number.isFinite(value)) return 0;
		return Math.min(max, Math.max(0, Math.round(value)));
	}

	// short human label for tooltips, e.g. "1h 5m" or "45s"
	function formatDurationLabel(totalSeconds: number): string {
		if (!Number.isFinite(totalSeconds)) return '-';
		const { h, m, s } = secondsToHMS(totalSeconds);
		const parts: string[] = [];
		if (h) parts.push(`${h}h`);
		if (m) parts.push(`${m}m`);
		if (s || parts.length === 0) parts.push(`${s}s`);
		return parts.join(' ');
	}

	// The big ticking number, split into segments (plain seconds under a
	// minute, clock-style above it) so each segment can be keyed on its own
	// value in the template - only the segment whose value actually just
	// changed (usually just seconds) re-mounts and plays the pop transition,
	// instead of the whole string popping on every tick.
	function countdownParts(
		totalSeconds: number,
		style: CountdownStyle
	): { value: string; unit?: string }[] {
		const { h, m, s } = secondsToHMS(totalSeconds);

		if (style === 'verbose') {
			const parts: { value: string; unit: string }[] = [];
			if (h) parts.push({ value: String(h), unit: 'h' });
			if (h || m) parts.push({ value: h ? String(m).padStart(2, '0') : String(m), unit: 'm' });
			parts.push({ value: h || m ? String(s).padStart(2, '0') : String(s), unit: 's' });
			return parts;
		}

		if (totalSeconds < 60) return [{ value: String(s) }];
		if (h > 0) {
			return [
				{ value: String(h) },
				{ value: String(m).padStart(2, '0') },
				{ value: String(s).padStart(2, '0') }
			];
		}
		return [{ value: String(m) }, { value: String(s).padStart(2, '0') }];
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

{#snippet themeSwatches(selectedId: string, onSelect: (id: string) => void)}
	<div class="flex flex-wrap items-center gap-1">
		{#each SLIDE_THEMES as t (t.id)}
			<button
				onclick={() => onSelect(t.id)}
				title={t.label}
				aria-pressed={selectedId === t.id}
				style={`background:${t.surfaceBackground}; border-bottom-color:${t.accent};`}
				class={`h-6 w-6 cursor-pointer border border-b-[3px] transition ${
					selectedId === t.id
						? 'border-accent outline-2 outline-offset-1 outline-accent'
						: 'border-border hover:border-accent/50'
				}`}
			></button>
		{/each}
	</div>
{/snippet}

<section class="w-full px-4 py-10 sm:px-6">
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">MD Slide Viewer</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Write Markdown, split it into slides with a <code>---</code> line, and present it as a live slideshow
		- fullscreen presenting and keyboard navigation included.
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

		<div class="flex items-center gap-1.5">
			<span class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">Theme</span>
			{@render themeSwatches(slideTheme, (id) => (slideTheme = id))}
		</div>

		<div class="ml-auto flex flex-wrap items-center gap-1">
			<button
				onclick={openSettings}
				title="Countdown settings"
				class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
			>
				<Timer class="h-3.5 w-3.5" />
				Countdown
			</button>
			<button
				onclick={openPresent}
				disabled={!code}
				title={countdownEnabled
					? `Present (${formatDurationLabel(countdownSeconds)} countdown first)`
					: 'Present'}
				class="flex cursor-pointer items-center gap-1.5 border border-accent/50 px-2.5 py-1.5 text-xs text-accent transition hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-accent"
			>
				<Presentation class="h-3.5 w-3.5" />
				Present
			</button>
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
			{#if data.posts.length > 0}
				<button
					onclick={openBlogPicker}
					title="Load Markdown from a blog post"
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<BookOpen class="h-3.5 w-3.5" />
					From Blog
				</button>
			{/if}
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
				<label for="slide-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					Markdown
				</label>
				<textarea
					id="slide-input"
					bind:value={code}
					onkeydown={handleInputKeydown}
					placeholder="Type or paste your slides here. Separate slides with a --- line."
					rows="20"
					spellcheck="false"
					class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
				></textarea>
			</div>
		{/if}

		<!-- Preview -->
		{#if viewMode !== 'code' && !present}
			<div class="min-w-0">
				<div class="flex items-center justify-between">
					<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Preview</p>
					<div class="flex items-center gap-2">
						<button
							onclick={goPrev}
							disabled={currentSlide === 0}
							aria-label="Previous slide"
							class="cursor-pointer border border-border p-1 text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
						>
							<ChevronLeft class="h-3.5 w-3.5" />
						</button>
						<span class="font-mono text-xs text-fg-muted">
							{slides.length ? currentSlide + 1 : 0} / {slides.length}
						</span>
						<button
							onclick={goNext}
							disabled={currentSlide === slides.length - 1}
							aria-label="Next slide"
							class="cursor-pointer border border-border p-1 text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
						>
							<ChevronRight class="h-3.5 w-3.5" />
						</button>
					</div>
				</div>

				<div
					bind:this={previewEl}
					style={slideThemeStyle(activeTheme)}
					data-slide-layout={activeTheme.layout}
					class="slide-inline slide-surface prose mt-2 w-full overflow-y-auto border border-border p-6 transition-all sm:p-8"
				>
					{#if renderError}
						<p class="not-prose text-sm text-red-400">{renderError}</p>
					{:else if slides[currentSlide]}
						{@html renderedHtml}
					{:else}
						<p class="not-prose text-sm text-fg-muted">Nothing to preview yet.</p>
					{/if}
				</div>

				{#if slides.length > 1}
					<div class="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
						{#each slides as slide, i (i)}
							<button
								onclick={() => goTo(i)}
								title={slideLabel(slide, i)}
								aria-current={i === currentSlide}
								class={`shrink-0 cursor-pointer border px-2.5 py-1 font-mono text-xs transition ${
									i === currentSlide
										? 'border-accent bg-accent text-bg'
										: 'border-border text-fg-muted hover:border-accent/50 hover:text-fg'
								}`}
							>
								{i + 1}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>

<!-- Present mode -->
{#if present}
	<div class="fixed inset-0 z-100">
		<div
			bind:this={previewEl}
			style={slideThemeStyle(activeTheme)}
			data-slide-layout={activeTheme.layout}
			class="slide-present slide-surface prose h-full w-full max-w-none overflow-y-auto p-8 sm:p-16"
		>
			{#if renderError}
				<p class="not-prose text-sm text-red-400">{renderError}</p>
			{:else if slides[currentSlide]}
				{@html renderedHtml}
			{:else}
				<p class="not-prose text-sm text-fg-muted">Nothing to present yet.</p>
			{/if}
		</div>

		<!-- top edge: hovering here reveals the slide counter + close button -->
		<div
			class="group/top absolute inset-x-0 top-0 flex h-16 items-start justify-between p-3 sm:h-20 sm:p-4"
		>
			<p
				class="pointer-events-none bg-bg/80 px-2 py-1 font-mono text-xs text-fg-muted opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/top:opacity-100"
			>
				Slide {slides.length ? currentSlide + 1 : 0} / {slides.length}
			</p>
			<button
				onclick={closePresent}
				title="Close (Esc)"
				class="cursor-pointer border border-border bg-bg/80 p-1.5 text-fg-muted opacity-0 backdrop-blur-sm transition duration-200 hover:border-accent/50 hover:text-fg group-hover/top:opacity-100"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- left edge: hovering here reveals only the previous-slide button.
		     Starts below the top zone so the two never overlap and fight
		     over which one is hovered in the corner. -->
		<div
			class="group/left absolute top-16 bottom-0 left-0 flex w-16 items-center pl-2 sm:top-20 sm:w-24 sm:pl-4"
		>
			<button
				onclick={goPrev}
				disabled={currentSlide === 0}
				aria-label="Previous slide"
				class="cursor-pointer border border-border bg-bg-alt/80 p-2 text-fg-muted opacity-0 backdrop-blur-sm transition duration-200 hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed group-hover/left:opacity-100 disabled:group-hover/left:opacity-30"
			>
				<ChevronLeft class="h-5 w-5" />
			</button>
		</div>

		<!-- right edge: hovering here reveals only the next-slide button.
		     Same top-16/sm:top-20 offset as the left zone, for the same reason. -->
		<div
			class="group/right absolute top-16 right-0 bottom-0 flex w-16 items-center justify-end pr-2 sm:top-20 sm:w-24 sm:pr-4"
		>
			<button
				onclick={goNext}
				disabled={currentSlide === slides.length - 1}
				aria-label="Next slide"
				class="cursor-pointer border border-border bg-bg-alt/80 p-2 text-fg-muted opacity-0 backdrop-blur-sm transition duration-200 hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed group-hover/right:opacity-100 disabled:group-hover/right:opacity-30"
			>
				<ChevronRight class="h-5 w-5" />
			</button>
		</div>
	</div>
{/if}

<!-- Countdown, shown before Present mode when enabled in Countdown settings -->
{#if counting}
	<div
		class={`fixed inset-0 z-100 flex flex-col bg-bg p-8 text-fg sm:p-16 ${COUNTDOWN_POSITION_CLASSES[countdownPosition]}`}
	>
		<!-- Full-screen background animation: decorative motion behind the timer,
		     not driven by real audio analysis (see the visualizer note below) -
		     painted first so every later element in this overlay stacks above it. -->
		{#if countdownMusicActive && countdownBgAnimationEnabled}
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
				{#if countdownBgAnimationStyle === 'gradient'}
					<div class="bg-anim-gradient"></div>
				{:else if countdownBgAnimationStyle === 'aurora'}
					<div class="bg-anim-aurora">
						<span></span><span></span><span></span>
					</div>
				{:else if countdownBgAnimationStyle === 'ripple'}
					<div class="bg-anim-ripple">
						<span></span><span></span><span></span>
					</div>
				{:else if countdownBgAnimationStyle === 'particles'}
					<div class="bg-anim-particles">
						{#each Array(24) as _, i (i)}
							<span
								style={`left:${(i * 37) % 100}%; animation-duration:${6 + (i % 5)}s; animation-delay:${((i * 0.83) % 6).toFixed(2)}s;`}
							></span>
						{/each}
					</div>
				{:else}
					<div class="bg-anim-pixel">
						{#each Array(90) as _, i (i)}
							<span
								style={`animation-duration:${(5 + pseudoRandom(i) * 3.6).toFixed(2)}s; animation-delay:${(pseudoRandom(i + 1000) * 8).toFixed(2)}s;`}
							></span>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<button
			onclick={cancelCountdown}
			title="Cancel (Esc)"
			class="absolute top-3 right-3 cursor-pointer border border-border bg-bg-alt p-1.5 text-fg-muted transition hover:border-accent/50 hover:text-fg"
		>
			<X class="h-4 w-4" />
		</button>

		<div class={`flex flex-col gap-4 ${countdownAlignClass}`}>
			<p class="font-mono text-lg uppercase tracking-wide text-fg-muted">Starting in</p>

			<p
				style={`font-family:${countdownFontValue}`}
				class={`flex items-baseline gap-1 font-extrabold tabular-nums ${
					countdownValue < 60 ? 'text-8xl sm:text-9xl' : 'text-6xl sm:text-8xl'
				}`}
			>
				{#each countdownDisplayParts as part, i (i)}
					{#if countdownStyle === 'digital' && i > 0}
						<span aria-hidden="true">:</span>
					{/if}
					{#key part.value}
						<span in:scale={{ duration: 350, start: 0.6 }} class="inline-flex items-baseline">
							{part.value}{#if part.unit}<span
									class="ml-0.5 text-[0.4em] font-normal text-fg-muted">{part.unit}</span
								>{/if}
						</span>
					{/key}
				{/each}
			</p>

			<div class="flex items-center gap-4">
				<button
					onclick={cancelCountdown}
					class="font-mono text-xs uppercase tracking-wide text-fg-muted underline decoration-dotted transition hover:text-fg"
				>
					Cancel
				</button>
				<button
					onclick={skipCountdown}
					title="Skip to presenting"
					class="font-mono text-xs uppercase tracking-wide text-accent underline decoration-dotted transition hover:text-fg"
				>
					Skip
				</button>
			</div>
		</div>

		<!-- Audio-only YouTube embed: kept off-screen (not display:none, which
		     would pause it) rather than visually rendered, per the Countdown
		     settings "Play music" option. Re-mounted fresh each time `counting`
		     flips true so playback always restarts from the top of the track,
		     and torn down (stopping audio) as soon as the countdown ends or is cancelled. -->
		{#if countdownMusicActive}
			<iframe
				src={countdownMusicSrc}
				title="Countdown music"
				aria-hidden="true"
				allow="autoplay; encrypted-media"
				class="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
			></iframe>
		{/if}

		<!-- Music visualizer: purely decorative CSS animation (not a real FFT
		     of the YouTube audio - a cross-origin iframe's audio can't be fed
		     into the Web Audio API), placed in its own configurable slot
		     (falls back to the timer's opposite slot if they'd collide). -->
		{#if countdownMusicActive && countdownVisualizerEnabled}
			<div
				aria-hidden="true"
				class={`pointer-events-none absolute inset-0 flex flex-col p-8 sm:p-16 ${COUNTDOWN_POSITION_CLASSES[visualizerDisplayPosition]}`}
			>
				<div class="flex flex-col items-center gap-3">
					<span class="font-mono text-xs uppercase tracking-wide text-fg-muted">
						<Music />
					</span>
					{#if countdownVisualizerStyle === 'bars'}
						<div class="visualizer-bars">
							{#each Array(5) as _, i (i)}
								<span style={`animation-delay:${i * 0.12}s`}></span>
							{/each}
						</div>
					{:else if countdownVisualizerStyle === 'wave'}
						<div class="visualizer-wave">
							{#each Array(6) as _, i (i)}
								<span style={`animation-delay:${i * 0.1}s`}></span>
							{/each}
						</div>
					{:else}
						<div class="visualizer-pulse">
							{#each Array(3) as _, i (i)}
								<span style={`animation-delay:${i * 0.5}s`}></span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Countdown settings modal -->
{#if settingsOpen}
	<div
		class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
	>
		<div
			class="flex max-h-[85vh] w-full max-w-md flex-col border border-accent bg-bg-alt text-fg shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Countdown settings"
		>
			<div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
				<div class="flex items-center gap-2">
					<Timer class="h-4 w-4 text-accent" />
					<span class="font-mono text-xs uppercase tracking-wide text-fg-muted">
						Countdown settings
					</span>
				</div>
				<button
					onclick={closeSettings}
					class="cursor-pointer text-fg-muted transition hover:text-fg"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="min-h-0 space-y-5 overflow-y-auto p-4">
				<label class="flex cursor-pointer items-center justify-between gap-3">
					<span class="text-sm text-fg">Show countdown before presenting</span>
					<button
						role="switch"
						aria-checked={countdownEnabled}
						aria-label="Show countdown before presenting"
						onclick={() => (countdownEnabled = !countdownEnabled)}
						class={`relative h-5 w-9 shrink-0 cursor-pointer border transition ${
							countdownEnabled ? 'border-accent bg-accent/20' : 'border-border bg-bg'
						}`}
					>
						<span
							class={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
								countdownEnabled ? 'left-[1.15rem] bg-accent' : 'left-0.5 bg-fg-muted'
							}`}
						></span>
					</button>
				</label>

				<div class={countdownEnabled ? '' : 'pointer-events-none opacity-40'}>
					<p class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">Duration</p>
					<div class="mt-2 flex items-end gap-1.5">
						<label class="flex flex-col gap-1">
							<span class="font-mono text-[0.6rem] uppercase tracking-wide text-fg-muted">
								Hours
							</span>
							<input
								type="number"
								bind:value={countdownHours}
								onblur={() => (countdownHours = clampField(countdownHours, 23))}
								min="0"
								max="23"
								step="1"
								class="w-16 border border-border bg-bg px-2 py-1.5 text-center text-sm font-mono text-fg focus:border-accent focus:outline-none"
							/>
						</label>
						<span class="pb-2 font-mono text-fg-muted">:</span>
						<label class="flex flex-col gap-1">
							<span class="font-mono text-[0.6rem] uppercase tracking-wide text-fg-muted">
								Min
							</span>
							<input
								type="number"
								bind:value={countdownMinutes}
								onblur={() => (countdownMinutes = clampField(countdownMinutes, 59))}
								min="0"
								max="59"
								step="1"
								class="w-16 border border-border bg-bg px-2 py-1.5 text-center text-sm font-mono text-fg focus:border-accent focus:outline-none"
							/>
						</label>
						<span class="pb-2 font-mono text-fg-muted">:</span>
						<label class="flex flex-col gap-1">
							<span class="font-mono text-[0.6rem] uppercase tracking-wide text-fg-muted">
								Sec
							</span>
							<input
								type="number"
								bind:value={countdownSecondsPart}
								onblur={() => (countdownSecondsPart = clampField(countdownSecondsPart, 59))}
								min="0"
								max="59"
								step="1"
								class="w-16 border border-border bg-bg px-2 py-1.5 text-center text-sm font-mono text-fg focus:border-accent focus:outline-none"
							/>
						</label>
					</div>
					<p class="mt-2 font-mono text-[0.65rem] text-fg-muted">
						Total: {formatDurationLabel(countdownSeconds)}
					</p>
				</div>

				<div class={countdownEnabled ? '' : 'pointer-events-none opacity-40'}>
					<p class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">Timer style</p>
					<div class="mt-2 inline-flex rounded-none border border-border">
						<button
							onclick={() => (countdownStyle = 'digital')}
							class={`cursor-pointer px-3 py-1.5 text-xs font-mono transition ${
								countdownStyle === 'digital' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
							}`}
						>
							Digital (05:30)
						</button>
						<button
							onclick={() => (countdownStyle = 'verbose')}
							class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono transition ${
								countdownStyle === 'verbose' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
							}`}
						>
							Verbose (5m 30s)
						</button>
					</div>
				</div>

				<div class={countdownEnabled ? '' : 'pointer-events-none opacity-40'}>
					<p class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">Position</p>
					<div class="mt-2 grid w-24 grid-cols-3 gap-1">
						{#each COUNTDOWN_POSITIONS as pos (pos)}
							<button
								onclick={() => (countdownPosition = pos)}
								aria-label={pos}
								aria-pressed={countdownPosition === pos}
								class={`h-7 w-7 cursor-pointer border transition ${
									countdownPosition === pos
										? 'border-accent bg-accent/20'
										: 'border-border hover:border-accent/50'
								}`}
							></button>
						{/each}
					</div>
				</div>

				<div class={countdownEnabled ? '' : 'pointer-events-none opacity-40'}>
					<p class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">Font</p>
					<div class="mt-2 inline-flex rounded-none border border-border">
						{#each COUNTDOWN_FONTS as f, i (f.id)}
							<button
								onclick={() => (countdownFont = f.id)}
								style={`font-family:${f.value}`}
								class={`cursor-pointer px-3 py-1.5 text-xs transition ${
									countdownFont === f.id ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
								} ${i > 0 ? 'border-l border-border' : ''}`}
							>
								{f.label}
							</button>
						{/each}
					</div>
				</div>

				<div class={countdownEnabled ? '' : 'pointer-events-none opacity-40'}>
					<label class="flex cursor-pointer items-center justify-between gap-3">
						<span class="flex items-center gap-1.5 text-sm text-fg">
							<Music class="h-3.5 w-3.5 text-fg-muted" />
							Play music (YouTube, audio only)
						</span>
						<button
							role="switch"
							aria-checked={countdownMusicEnabled}
							aria-label="Play music during countdown"
							onclick={() => (countdownMusicEnabled = !countdownMusicEnabled)}
							class={`relative h-5 w-9 shrink-0 cursor-pointer border transition ${
								countdownMusicEnabled ? 'border-accent bg-accent/20' : 'border-border bg-bg'
							}`}
						>
							<span
								class={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
									countdownMusicEnabled ? 'left-[1.15rem] bg-accent' : 'left-0.5 bg-fg-muted'
								}`}
							></span>
						</button>
					</label>
					<div class={countdownMusicEnabled ? 'mt-2' : 'mt-2 pointer-events-none opacity-40'}>
						<input
							type="url"
							bind:value={countdownMusicUrl}
							placeholder="https://www.youtube.com/watch?v=..."
							class={`w-full border bg-bg px-2.5 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none ${
								countdownMusicUrlValid === false
									? 'border-red-400 focus:border-red-400'
									: 'border-border focus:border-accent'
							}`}
						/>
						{#if countdownMusicUrlValid === false}
							<p class="mt-1 font-mono text-[0.65rem] text-red-400">
								Doesn't look like a YouTube URL.
							</p>
						{:else}
							<p class="mt-1 font-mono text-[0.65rem] text-fg-muted">
								Video stays hidden - only the audio plays, looping while the countdown runs.
							</p>
						{/if}
					</div>

					<div
						class={countdownMusicEnabled ? 'mt-4' : 'mt-4 pointer-events-none opacity-40'}
					>
						<label class="flex cursor-pointer items-center justify-between gap-3">
							<span class="text-sm text-fg">Show spectrum animation</span>
							<button
								role="switch"
								aria-checked={countdownVisualizerEnabled}
								aria-label="Show spectrum animation during countdown"
								onclick={() => (countdownVisualizerEnabled = !countdownVisualizerEnabled)}
								class={`relative h-5 w-9 shrink-0 cursor-pointer border transition ${
									countdownVisualizerEnabled ? 'border-accent bg-accent/20' : 'border-border bg-bg'
								}`}
							>
								<span
									class={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
										countdownVisualizerEnabled ? 'left-[1.15rem] bg-accent' : 'left-0.5 bg-fg-muted'
									}`}
								></span>
							</button>
						</label>
						<div
							class={countdownVisualizerEnabled
								? 'mt-2 inline-flex rounded-none border border-border'
								: 'mt-2 inline-flex rounded-none border border-border pointer-events-none opacity-40'}
						>
							{#each COUNTDOWN_VISUALIZER_STYLES as v, i (v.id)}
								<button
									onclick={() => (countdownVisualizerStyle = v.id)}
									class={`cursor-pointer px-3 py-1.5 text-xs font-mono transition ${
										countdownVisualizerStyle === v.id
											? 'bg-accent text-bg'
											: 'text-fg-muted hover:text-fg'
									} ${i > 0 ? 'border-l border-border' : ''}`}
								>
									{v.label}
								</button>
							{/each}
						</div>
						<div class="mt-3">
							<p class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">
								Position
							</p>
							<div class="mt-2 grid w-24 grid-cols-3 gap-1">
								{#each COUNTDOWN_POSITIONS as pos (pos)}
									<button
										onclick={() => (countdownVisualizerPosition = pos)}
										disabled={pos === countdownPosition}
										aria-label={pos}
										title={pos === countdownPosition ? `${pos} - used by the timer` : pos}
										aria-pressed={visualizerDisplayPosition === pos}
										class={`h-7 w-7 border transition ${
											pos === countdownPosition
												? 'cursor-not-allowed border-border opacity-30'
												: 'cursor-pointer'
										} ${
											visualizerDisplayPosition === pos
												? 'border-accent bg-accent/20'
												: 'border-border hover:border-accent/50'
										}`}
									></button>
								{/each}
							</div>
							<p class="mt-2 font-mono text-[0.65rem] text-fg-muted">
								Dimmed slot is taken by the timer.
							</p>
						</div>
					</div>

					<div
						class={countdownMusicEnabled ? 'mt-4' : 'mt-4 pointer-events-none opacity-40'}
					>
						<label class="flex cursor-pointer items-center justify-between gap-3">
							<span class="text-sm text-fg">Show background animation</span>
							<button
								role="switch"
								aria-checked={countdownBgAnimationEnabled}
								aria-label="Show full-screen background animation during countdown"
								onclick={() => (countdownBgAnimationEnabled = !countdownBgAnimationEnabled)}
								class={`relative h-5 w-9 shrink-0 cursor-pointer border transition ${
									countdownBgAnimationEnabled ? 'border-accent bg-accent/20' : 'border-border bg-bg'
								}`}
							>
								<span
									class={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
										countdownBgAnimationEnabled ? 'left-[1.15rem] bg-accent' : 'left-0.5 bg-fg-muted'
									}`}
								></span>
							</button>
						</label>
						<div
							class={countdownBgAnimationEnabled
								? 'mt-2 inline-flex flex-wrap rounded-none border border-border'
								: 'mt-2 inline-flex flex-wrap rounded-none border border-border pointer-events-none opacity-40'}
						>
							{#each COUNTDOWN_BG_ANIMATION_STYLES as b, i (b.id)}
								<button
									onclick={() => (countdownBgAnimationStyle = b.id)}
									class={`cursor-pointer px-3 py-1.5 text-xs font-mono transition ${
										countdownBgAnimationStyle === b.id
											? 'bg-accent text-bg'
											: 'text-fg-muted hover:text-fg'
									} ${i > 0 ? 'border-l border-border' : ''}`}
								>
									{b.label}
								</button>
							{/each}
						</div>
						<p class="mt-2 font-mono text-[0.65rem] text-fg-muted">
							Soft full-screen motion behind the timer.
						</p>
					</div>
				</div>
			</div>

			<div class="flex shrink-0 items-center justify-end border-t border-border px-4 py-3">
				<button
					onclick={closeSettings}
					class="cursor-pointer border border-accent/50 px-3 py-1.5 text-xs text-accent transition hover:bg-accent hover:text-bg"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Blog post picker: loads a post's raw Markdown as an alternative source to typing/pasting -->
{#if blogPickerOpen}
	<div
		class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
	>
		<div
			class="flex h-128 max-h-[85vh] w-full max-w-md flex-col border border-accent bg-bg-alt text-fg shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Load from blog post"
		>
			<div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
				<div class="flex items-center gap-2">
					<BookOpen class="h-4 w-4 text-accent" />
					<span class="font-mono text-xs uppercase tracking-wide text-fg-muted">
						Load from blog post
					</span>
				</div>
				<button
					onclick={closeBlogPicker}
					class="cursor-pointer text-fg-muted transition hover:text-fg"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="shrink-0 border-b border-border p-4">
				<input
					type="search"
					bind:value={blogSearchQuery}
					placeholder="Search posts…"
					aria-label="Search blog posts"
					class="w-full border border-border bg-bg px-2.5 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
				/>
				<p class="mt-2 font-mono text-[0.65rem] text-fg-muted">
					Replaces the current Markdown with the raw content of the selected post. Add
					<code>---</code> lines to split it into slides.
				</p>
			</div>

			<div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
				{#if blogPickerError}
					<p class="font-mono text-xs text-red-400">{blogPickerError}</p>
				{/if}
				{#if postsByCategory.length === 0}
					<p class="font-mono text-xs text-fg-muted">No posts match "{blogSearchQuery}".</p>
				{/if}
				{#each postsByCategory as [category, posts] (category)}
					<div>
						<p class="font-mono text-[0.65rem] uppercase tracking-wide text-fg-muted">
							{category}
						</p>
						<div class="mt-2 space-y-1">
							{#each posts as post (post.slug)}
								<button
									onclick={() => loadFromBlogPost(post)}
									disabled={blogPickerLoadingSlug !== null}
									class="flex w-full cursor-pointer items-center justify-between gap-3 border border-border px-3 py-2 text-left transition hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
								>
									<span class="truncate text-sm text-fg">{post.title}</span>
									<span class="shrink-0 font-mono text-[0.65rem] text-fg-muted">
										{blogPickerLoadingSlug === post.slug ? 'Loading…' : formatDate(post.date)}
									</span>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="flex shrink-0 items-center justify-between border-t border-border px-4 py-3">
				<button
					onclick={() => (blogPage = Math.max(0, blogCurrentPage - 1))}
					disabled={blogCurrentPage === 0}
					class="flex cursor-pointer items-center gap-1 font-mono text-xs uppercase tracking-wide text-fg-muted transition hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronLeft class="h-3.5 w-3.5" />
					Prev
				</button>
				<span class="font-mono text-[0.65rem] text-fg-muted">
					Page {blogCurrentPage + 1} / {blogTotalPages}
				</span>
				<button
					onclick={() => (blogPage = Math.min(blogTotalPages - 1, blogCurrentPage + 1))}
					disabled={blogCurrentPage >= blogTotalPages - 1}
					class="flex cursor-pointer items-center gap-1 font-mono text-xs uppercase tracking-wide text-fg-muted transition hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
				>
					Next
					<ChevronRight class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Full-screen background animations behind the countdown, and the small
	   corner visualizer below it, are both decorative CSS loops - not a
	   real-time frequency analysis of the audio. YouTube's iframe is
	   cross-origin, so its audio stream can't be piped into the Web Audio
	   API for genuine FFT-driven motion. */
	.bg-anim-gradient {
		position: absolute;
		inset: -25%;
		background: linear-gradient(
			120deg,
			color-mix(in srgb, var(--color-accent) 30%, transparent),
			transparent 35%,
			color-mix(in srgb, var(--color-accent) 22%, transparent) 65%,
			transparent 90%
		);
		background-size: 220% 220%;
		filter: blur(50px);
		animation: bg-anim-gradient-move 10s ease-in-out infinite;
	}
	@keyframes bg-anim-gradient-move {
		0%,
		100% {
			background-position: 0% 30%;
		}
		50% {
			background-position: 100% 70%;
		}
	}

	.bg-anim-aurora {
		position: absolute;
		inset: 0;
	}
	.bg-anim-aurora span {
		position: absolute;
		width: 45vmax;
		height: 45vmax;
		border-radius: 9999px;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-accent) 60%, transparent),
			transparent 70%
		);
		filter: blur(60px);
		animation: bg-anim-aurora-move 12s ease-in-out infinite;
	}
	.bg-anim-aurora span:nth-child(1) {
		top: -15%;
		left: -10%;
		animation-delay: 0s;
	}
	.bg-anim-aurora span:nth-child(2) {
		right: -15%;
		bottom: -10%;
		animation-delay: -4s;
	}
	.bg-anim-aurora span:nth-child(3) {
		top: 30%;
		left: 35%;
		animation-delay: -8s;
	}
	@keyframes bg-anim-aurora-move {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(8%, 10%) scale(1.2);
		}
	}

	.bg-anim-ripple {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.bg-anim-ripple span {
		position: absolute;
		width: 18vmin;
		height: 18vmin;
		border-radius: 9999px;
		border: 2px solid var(--color-accent);
		animation: bg-anim-ripple-move 3.6s ease-out infinite;
	}
	.bg-anim-ripple span:nth-child(1) {
		animation-delay: 0s;
	}
	.bg-anim-ripple span:nth-child(2) {
		animation-delay: -1.2s;
	}
	.bg-anim-ripple span:nth-child(3) {
		animation-delay: -2.4s;
	}
	@keyframes bg-anim-ripple-move {
		0% {
			transform: scale(0.2);
			opacity: 0.5;
		}
		100% {
			transform: scale(3.4);
			opacity: 0;
		}
	}

	.bg-anim-particles {
		position: absolute;
		inset: 0;
	}
	.bg-anim-particles span {
		position: absolute;
		bottom: -10px;
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: var(--color-accent);
		opacity: 0;
		animation-name: bg-anim-particles-move;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes bg-anim-particles-move {
		0% {
			transform: translateY(0) scale(1);
			opacity: 0;
		}
		10% {
			opacity: 0.55;
		}
		90% {
			opacity: 0.35;
		}
		100% {
			transform: translateY(-110vh) scale(0.5);
			opacity: 0;
		}
	}

	.bg-anim-pixel {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		/* auto (not 1fr) lets each cell's aspect-ratio actually drive the row
		   height - with 1fr both axes are stretched to definite sizes and
		   aspect-ratio is ignored, which is why cells came out rectangular */
		grid-auto-rows: auto;
		align-content: center;
		gap: 3px;
		padding: 3px;
	}
	.bg-anim-pixel span {
		aspect-ratio: 1;
		background: var(--color-accent);
		opacity: 0;
		animation-name: bg-anim-pixel-flicker;
		animation-timing-function: steps(1, jump-end);
		animation-iteration-count: infinite;
	}
	@keyframes bg-anim-pixel-flicker {
		0%,
		45% {
			opacity: 0;
		}
		50%,
		90% {
			opacity: 0.4;
		}
		95%,
		100% {
			opacity: 0;
		}
	}

	/* Music visualizers: decorative CSS pulses, not a real-time frequency
	   analysis of the audio - YouTube's iframe is cross-origin, so its audio
	   stream can't be piped into the Web Audio API for genuine FFT bars. */
	.visualizer-bars {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		height: 80px;
	}
	.visualizer-bars span {
		width: 10px;
		border-radius: 2px;
		background: var(--color-accent);
		animation: visualizer-bars 0.9s ease-in-out infinite;
	}
	@keyframes visualizer-bars {
		0%,
		100% {
			height: 20%;
		}
		50% {
			height: 100%;
		}
	}

	.visualizer-wave {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 64px;
	}
	.visualizer-wave span {
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: var(--color-accent);
		animation: visualizer-wave 1.1s ease-in-out infinite;
	}
	@keyframes visualizer-wave {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		50% {
			transform: translateY(-22px);
			opacity: 1;
		}
	}

	.visualizer-pulse {
		position: relative;
		width: 64px;
		height: 64px;
	}
	.visualizer-pulse span {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		border: 3px solid var(--color-accent);
		animation: visualizer-pulse 1.8s ease-out infinite;
	}
	@keyframes visualizer-pulse {
		0% {
			transform: scale(0.3);
			opacity: 1;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	.slide-inline {
		aspect-ratio: 16 / 9;
		font-size: 0.95rem;
	}

	.slide-present {
		font-size: clamp(1rem, 2.4vw, 1.75rem);
		display: flex;
		flex-direction: column;
		/* "safe" falls back to start-alignment once content overflows the
		   viewport - plain `center` splits the overflow evenly above and below,
		   but this container can only scroll to a non-negative offset, so the
		   portion pushed above the top edge became permanently unreachable. */
		justify-content: safe center;
	}

	/* Slide theme templates: "Default" sets none of the --slide-* custom
	   properties, so every value below falls back to the site's own ambient
	   --color-* tokens - the look is unchanged unless another theme is picked. */
	.slide-surface {
		background: var(--slide-surface-bg, var(--color-bg));
		color: var(--slide-fg, var(--color-fg));
		font-family: var(--slide-font, var(--font-sans));
	}

	.slide-surface.prose {
		--tw-prose-body: var(--slide-fg, var(--color-fg));
		--tw-prose-headings: var(--slide-heading, var(--slide-fg, var(--color-fg)));
		--tw-prose-bold: var(--slide-heading, var(--slide-fg, var(--color-fg)));
		--tw-prose-lead: var(--slide-fg, var(--color-fg));
		--tw-prose-links: var(--slide-accent, var(--color-accent));
		--tw-prose-bullets: var(--slide-fg, var(--color-fg));
		--tw-prose-counters: var(--slide-fg, var(--color-fg));
		--tw-prose-quotes: var(--slide-fg, var(--color-fg));
		--tw-prose-quote-borders: var(--slide-accent, var(--color-accent));
		--tw-prose-hr: var(--slide-accent, var(--color-accent));
		--tw-prose-captions: var(--slide-fg, var(--color-fg));
		--tw-prose-th-borders: color-mix(in srgb, var(--slide-fg, var(--color-fg)) 30%, transparent);
		--tw-prose-td-borders: color-mix(in srgb, var(--slide-fg, var(--color-fg)) 15%, transparent);
	}

	/* background only - border-left-color on callout variants (tip/warning/…)
	   is semantic and must keep winning, so we don't touch border color here */
	.slide-surface.prose :global(.callout) {
		background-color: color-mix(
			in srgb,
			var(--slide-bg, var(--color-bg)) 85%,
			var(--slide-fg, var(--color-fg)) 15%
		);
	}

	.slide-surface.prose :global(.table-wrapper) {
		border-color: color-mix(in srgb, var(--slide-fg, var(--color-fg)) 20%, transparent);
	}

	.slide-surface.prose :global(thead),
	.slide-surface.prose :global(tbody tr:nth-child(even)) {
		background-color: color-mix(
			in srgb,
			var(--slide-bg, var(--color-bg)) 88%,
			var(--slide-fg, var(--color-fg)) 12%
		);
	}

	/* ---------- text-layout templates ----------
	   Layered independently of color: a theme picks a `layout`, rendered here
	   as a `[data-slide-layout]` attribute, so color and layout mix freely. */

	.slide-surface[data-slide-layout='centered'] :global(:is(h1, h2, h3, h4, h5, h6, p, blockquote)) {
		text-align: center;
	}

	.slide-surface[data-slide-layout='poster'] :global(:is(h1, h2, h3)) {
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 800;
	}
	.slide-surface[data-slide-layout='poster'] :global(p) {
		text-align: center;
	}

	.slide-surface[data-slide-layout='editorial'] :global(:is(h1, h2)) {
		padding-bottom: 0.25em;
		border-bottom: 2px solid var(--slide-accent, var(--color-accent));
	}
	.slide-surface[data-slide-layout='editorial'] :global(p) {
		line-height: 1.85;
	}

	.slide-surface[data-slide-layout='compact'] :global(:is(h1, h2, h3, h4)) {
		margin-top: 0.5em;
		margin-bottom: 0.35em;
	}
	.slide-surface[data-slide-layout='compact'] :global(:is(p, li)) {
		margin-top: 0.35em;
		margin-bottom: 0.35em;
		line-height: 1.35;
	}
</style>
