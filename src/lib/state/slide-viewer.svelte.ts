export type ViewMode = 'split' | 'code' | 'preview';

/**
 * Text-layout treatment layered on top of a theme's colors - everything
 * beyond "default" (unchanged prose flow) targets `[data-slide-layout]`
 * rules in the route's <style> block, not per-theme CSS variables.
 */
export type SlideLayout = 'default' | 'centered' | 'poster' | 'editorial' | 'compact';

export interface SlideTheme {
	id: string;
	label: string;
	/** CSS `background` value for the slide surface - a solid color or a gradient. */
	surfaceBackground: string;
	/** Solid color standing in for the background wherever a flat color is required (e.g. `color-mix`). */
	bg: string;
	fg: string;
	heading: string;
	accent: string;
	font: string;
	layout: SlideLayout;
}

export const SLIDE_THEMES: SlideTheme[] = [
	{
		id: 'default',
		label: 'Default',
		surfaceBackground: 'var(--color-bg)',
		bg: 'var(--color-bg)',
		fg: 'var(--color-fg)',
		heading: 'var(--color-fg)',
		accent: 'var(--color-accent)',
		font: 'var(--font-sans)',
		layout: 'default'
	},
	{
		id: 'midnight',
		label: 'Midnight',
		surfaceBackground: '#0f172a',
		bg: '#0f172a',
		fg: '#cbd5e1',
		heading: '#f8fafc',
		accent: '#38bdf8',
		font: 'var(--font-sans)',
		layout: 'default'
	},
	{
		id: 'paper',
		label: 'Paper',
		surfaceBackground: '#fdfdfb',
		bg: '#fdfdfb',
		fg: '#374151',
		heading: '#111827',
		accent: '#2563eb',
		font: 'Georgia, "Times New Roman", serif',
		layout: 'default'
	},
	{
		id: 'sunset',
		label: 'Sunset',
		surfaceBackground: 'linear-gradient(135deg, #f97316, #db2777)',
		bg: '#c2469a',
		fg: '#fff7ed',
		heading: '#ffffff',
		accent: '#fde047',
		font: 'var(--font-sans)',
		layout: 'default'
	},
	{
		id: 'forest',
		label: 'Forest',
		surfaceBackground: '#052e16',
		bg: '#052e16',
		fg: '#dcfce7',
		heading: '#f0fdf4',
		accent: '#4ade80',
		font: 'var(--font-sans)',
		layout: 'default'
	},
	{
		id: 'terminal',
		label: 'Terminal',
		surfaceBackground: '#0a0a0a',
		bg: '#0a0a0a',
		fg: '#4ade80',
		heading: '#86efac',
		accent: '#4ade80',
		font: 'var(--font-mono)',
		layout: 'default'
	},
	{
		id: 'zen',
		label: 'Zen',
		surfaceBackground: '#faf9f6',
		bg: '#faf9f6',
		fg: '#44403c',
		heading: '#1c1917',
		accent: '#0d9488',
		font: 'var(--font-sans)',
		layout: 'centered'
	},
	{
		id: 'spotlight',
		label: 'Spotlight',
		surfaceBackground: 'radial-gradient(circle at 50% 30%, #1f1f1f, #050505)',
		bg: '#141414',
		fg: '#f5f5f5',
		heading: '#ffffff',
		accent: '#facc15',
		font: 'var(--font-sans)',
		layout: 'poster'
	},
	{
		id: 'editorial',
		label: 'Editorial',
		surfaceBackground: '#1a1a2e',
		bg: '#1a1a2e',
		fg: '#e5e1d8',
		heading: '#ffffff',
		accent: '#e63946',
		font: 'Georgia, "Times New Roman", serif',
		layout: 'editorial'
	},
	{
		id: 'compact',
		label: 'Compact',
		surfaceBackground: 'var(--color-bg)',
		bg: 'var(--color-bg)',
		fg: 'var(--color-fg)',
		heading: 'var(--color-fg)',
		accent: 'var(--color-accent)',
		font: 'var(--font-sans)',
		layout: 'compact'
	}
];

export const DEFAULT_SLIDE_THEME = SLIDE_THEMES[0].id;

export const DEFAULT_COUNTDOWN_SECONDS = 3;
export const MIN_COUNTDOWN_SECONDS = 1;
// 23:59:59 - the duration inputs are hours/minutes/seconds, clock-style
export const MAX_COUNTDOWN_SECONDS = 23 * 3600 + 59 * 60 + 59;

/** "digital" ticks like a clock (05, 1:05, 1:05:30); "verbose" spells out units (1h 5m 30s). */
export type CountdownStyle = 'digital' | 'verbose';

export type CountdownPosition =
	| 'top-left'
	| 'top'
	| 'top-right'
	| 'left'
	| 'center'
	| 'right'
	| 'bottom-left'
	| 'bottom'
	| 'bottom-right';

export const COUNTDOWN_POSITIONS: CountdownPosition[] = [
	'top-left',
	'top',
	'top-right',
	'left',
	'center',
	'right',
	'bottom-left',
	'bottom',
	'bottom-right'
];

export const DEFAULT_COUNTDOWN_POSITION: CountdownPosition = 'center';

const OPPOSITE_COUNTDOWN_POSITION: Record<CountdownPosition, CountdownPosition> = {
	'top-left': 'bottom-right',
	top: 'bottom',
	'top-right': 'bottom-left',
	left: 'right',
	// center has no true opposite corner - bottom is the least likely spot
	// for the timer's own text to reach, so it stays clear of it
	center: 'bottom',
	right: 'left',
	'bottom-left': 'top-right',
	bottom: 'top',
	'bottom-right': 'top-left'
};

/** The screen slot diagonally/edge-opposite a countdown position - where the music visualizer goes so it never overlaps the timer text. */
export function oppositeCountdownPosition(pos: CountdownPosition): CountdownPosition {
	return OPPOSITE_COUNTDOWN_POSITION[pos];
}

export type CountdownVisualizerStyle = 'bars' | 'wave' | 'pulse';

export interface CountdownVisualizerOption {
	id: CountdownVisualizerStyle;
	label: string;
}

export const COUNTDOWN_VISUALIZER_STYLES: CountdownVisualizerOption[] = [
	{ id: 'bars', label: 'Bars' },
	{ id: 'wave', label: 'Wave' },
	{ id: 'pulse', label: 'Pulse' }
];

export const DEFAULT_COUNTDOWN_VISUALIZER_STYLE: CountdownVisualizerStyle = 'bars';

/** Falls back to the opposite side, so it never starts out overlapping the timer. */
export const DEFAULT_COUNTDOWN_VISUALIZER_POSITION: CountdownPosition =
	oppositeCountdownPosition(DEFAULT_COUNTDOWN_POSITION);

export type CountdownBgAnimationStyle = 'gradient' | 'aurora' | 'ripple' | 'particles' | 'pixel';

export interface CountdownBgAnimationOption {
	id: CountdownBgAnimationStyle;
	label: string;
}

export const COUNTDOWN_BG_ANIMATION_STYLES: CountdownBgAnimationOption[] = [
	{ id: 'gradient', label: 'Gradient' },
	{ id: 'aurora', label: 'Aurora' },
	{ id: 'ripple', label: 'Ripple' },
	{ id: 'particles', label: 'Particles' },
	{ id: 'pixel', label: 'Pixel' }
];

export const DEFAULT_COUNTDOWN_BG_ANIMATION_STYLE: CountdownBgAnimationStyle = 'gradient';

export interface CountdownFont {
	id: string;
	label: string;
	value: string;
}

export const COUNTDOWN_FONTS: CountdownFont[] = [
	{ id: 'sans', label: 'Sans', value: 'var(--font-sans)' },
	{ id: 'mono', label: 'Mono', value: 'var(--font-mono)' },
	{ id: 'serif', label: 'Serif', value: 'Georgia, "Times New Roman", serif' }
];

export const DEFAULT_COUNTDOWN_FONT = COUNTDOWN_FONTS[1].id;

/**
 * Pulls the video ID out of the common YouTube URL shapes (watch, youtu.be,
 * embed, shorts), ignoring extra query params like playlist or timestamp.
 * Returns null if the string isn't a recognizable YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
	const trimmed = url.trim();
	if (!trimmed) return null;
	const match = trimmed.match(
		/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
	);
	return match ? match[1] : null;
}

/** Reads a `t=`/`start=` timestamp (seconds, or `1h2m3s` style) off a YouTube URL, if present. */
export function extractYouTubeStart(url: string): number {
	const match = url.match(/[?&](?:t|start)=([\w]+)/);
	if (!match) return 0;
	const raw = match[1];
	if (/^\d+$/.test(raw)) return parseInt(raw, 10);
	const hms = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
	if (!hms) return 0;
	const [, h, m, s] = hms;
	return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export const SLIDE_EXAMPLE = `# Slide Viewer

A quick tour of what this tool can do.

Separate slides with a blank line, a line containing only \`---\`, and another blank line.

---

## Markdown, as usual

- Headings, lists, and **bold** / _italic_ text
- Fenced code blocks with syntax highlighting
- Tables, callouts, and math

\`\`\`js
function hello(name) {
	console.log(\`Hello, \${name}!\`);
}
\`\`\`

---

## Math works too

$$
E = mc^2
$$

> [!TIP]
> Use the arrow keys (or click the edges) to move between slides in Present mode.

---

## Diagrams

\`\`\`mermaid
graph TD
	A[Write Markdown] --> B[Split on ---]
	B --> C[Present fullscreen]
\`\`\`

---

## Thanks!

Press **Present** to try fullscreen mode.
`;

/**
 * Splits raw markdown into slides on a `---` thematic-break line, but only
 * when it sits on its own line preceded by a blank line - this keeps setext
 * headings (`Title\n---`) from being misread as a slide boundary.
 */
export function splitSlides(markdown: string): string[] {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const slides: string[] = [];
	let current: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const isSeparator = /^-{3,}\s*$/.test(line);
		const precededByBlank = i === 0 || lines[i - 1].trim() === '';

		if (isSeparator && precededByBlank) {
			slides.push(current.join('\n'));
			current = [];
			continue;
		}
		current.push(line);
	}
	slides.push(current.join('\n'));

	const trimmed = slides.map((slide) => slide.trim()).filter((slide) => slide.length > 0);
	return trimmed.length > 0 ? trimmed : [''];
}

const STORAGE_KEY = 'tools:md-slide-viewer';

type PersistedState = {
	code: string;
	viewMode: ViewMode;
	currentSlide: number;
	theme: string;
	countdownEnabled: boolean;
	countdownSeconds: number;
	countdownStyle: CountdownStyle;
	countdownPosition: CountdownPosition;
	countdownFont: string;
	countdownMusicEnabled: boolean;
	countdownMusicUrl: string;
	countdownVisualizerEnabled: boolean;
	countdownVisualizerStyle: CountdownVisualizerStyle;
	countdownVisualizerPosition: CountdownPosition;
	countdownBgAnimationEnabled: boolean;
	countdownBgAnimationStyle: CountdownBgAnimationStyle;
};

function loadPersisted(): PersistedState {
	const fallback: PersistedState = {
		code: SLIDE_EXAMPLE,
		viewMode: 'split',
		currentSlide: 0,
		theme: DEFAULT_SLIDE_THEME,
		countdownEnabled: false,
		countdownSeconds: DEFAULT_COUNTDOWN_SECONDS,
		countdownStyle: 'digital',
		countdownPosition: DEFAULT_COUNTDOWN_POSITION,
		countdownFont: DEFAULT_COUNTDOWN_FONT,
		countdownMusicEnabled: false,
		countdownMusicUrl: '',
		countdownVisualizerEnabled: false,
		countdownVisualizerStyle: DEFAULT_COUNTDOWN_VISUALIZER_STYLE,
		countdownVisualizerPosition: DEFAULT_COUNTDOWN_VISUALIZER_POSITION,
		countdownBgAnimationEnabled: false,
		countdownBgAnimationStyle: DEFAULT_COUNTDOWN_BG_ANIMATION_STYLE
	};

	if (typeof localStorage === 'undefined') return fallback;

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return {
			code: typeof parsed.code === 'string' ? parsed.code : fallback.code,
			viewMode:
				parsed.viewMode === 'split' || parsed.viewMode === 'code' || parsed.viewMode === 'preview'
					? parsed.viewMode
					: fallback.viewMode,
			currentSlide:
				typeof parsed.currentSlide === 'number' && Number.isFinite(parsed.currentSlide)
					? Math.max(0, Math.floor(parsed.currentSlide))
					: fallback.currentSlide,
			theme:
				typeof parsed.theme === 'string' && SLIDE_THEMES.some((t) => t.id === parsed.theme)
					? parsed.theme
					: fallback.theme,
			countdownEnabled:
				typeof parsed.countdownEnabled === 'boolean'
					? parsed.countdownEnabled
					: fallback.countdownEnabled,
			countdownSeconds:
				typeof parsed.countdownSeconds === 'number' && Number.isFinite(parsed.countdownSeconds)
					? Math.min(
							MAX_COUNTDOWN_SECONDS,
							Math.max(MIN_COUNTDOWN_SECONDS, Math.round(parsed.countdownSeconds))
						)
					: fallback.countdownSeconds,
			countdownStyle:
				parsed.countdownStyle === 'digital' || parsed.countdownStyle === 'verbose'
					? parsed.countdownStyle
					: fallback.countdownStyle,
			countdownPosition: COUNTDOWN_POSITIONS.includes(parsed.countdownPosition)
				? parsed.countdownPosition
				: fallback.countdownPosition,
			countdownFont:
				typeof parsed.countdownFont === 'string' &&
				COUNTDOWN_FONTS.some((f) => f.id === parsed.countdownFont)
					? parsed.countdownFont
					: fallback.countdownFont,
			countdownMusicEnabled:
				typeof parsed.countdownMusicEnabled === 'boolean'
					? parsed.countdownMusicEnabled
					: fallback.countdownMusicEnabled,
			countdownMusicUrl:
				typeof parsed.countdownMusicUrl === 'string'
					? parsed.countdownMusicUrl
					: fallback.countdownMusicUrl,
			countdownVisualizerEnabled:
				typeof parsed.countdownVisualizerEnabled === 'boolean'
					? parsed.countdownVisualizerEnabled
					: fallback.countdownVisualizerEnabled,
			countdownVisualizerStyle: COUNTDOWN_VISUALIZER_STYLES.some(
				(s) => s.id === parsed.countdownVisualizerStyle
			)
				? parsed.countdownVisualizerStyle
				: fallback.countdownVisualizerStyle,
			countdownVisualizerPosition: COUNTDOWN_POSITIONS.includes(parsed.countdownVisualizerPosition)
				? parsed.countdownVisualizerPosition
				: fallback.countdownVisualizerPosition,
			countdownBgAnimationEnabled:
				typeof parsed.countdownBgAnimationEnabled === 'boolean'
					? parsed.countdownBgAnimationEnabled
					: fallback.countdownBgAnimationEnabled,
			countdownBgAnimationStyle: COUNTDOWN_BG_ANIMATION_STYLES.some(
				(s) => s.id === parsed.countdownBgAnimationStyle
			)
				? parsed.countdownBgAnimationStyle
				: fallback.countdownBgAnimationStyle
		};
	} catch {
		return fallback;
	}
}

export const slideViewerState = $state(loadPersisted());

export function saveSlideViewerState() {
	if (typeof localStorage === 'undefined') return;

	const payload: PersistedState = {
		code: slideViewerState.code,
		viewMode: slideViewerState.viewMode,
		currentSlide: slideViewerState.currentSlide,
		theme: slideViewerState.theme,
		countdownEnabled: slideViewerState.countdownEnabled,
		countdownSeconds: slideViewerState.countdownSeconds,
		countdownStyle: slideViewerState.countdownStyle,
		countdownPosition: slideViewerState.countdownPosition,
		countdownFont: slideViewerState.countdownFont,
		countdownMusicEnabled: slideViewerState.countdownMusicEnabled,
		countdownMusicUrl: slideViewerState.countdownMusicUrl,
		countdownVisualizerEnabled: slideViewerState.countdownVisualizerEnabled,
		countdownVisualizerStyle: slideViewerState.countdownVisualizerStyle,
		countdownVisualizerPosition: slideViewerState.countdownVisualizerPosition,
		countdownBgAnimationEnabled: slideViewerState.countdownBgAnimationEnabled,
		countdownBgAnimationStyle: slideViewerState.countdownBgAnimationStyle
	};

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// storage unavailable or full - ignore
	}
}
