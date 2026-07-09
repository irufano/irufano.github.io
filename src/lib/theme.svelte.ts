export type ThemeGroup = 'dark' | 'light';

export interface ThemeMeta {
	id: string;
	label: string;
	group: ThemeGroup;
}

export const THEMES: ThemeMeta[] = [
	{ id: 'catppuccin', label: 'catppuccin', group: 'dark' },
	{ id: 'terminal', label: 'terminal', group: 'dark' },
	{ id: 'tokyo-night', label: 'tokyo night', group: 'dark' },
	{ id: 'dracula', label: 'dracula', group: 'dark' },
	{ id: 'nord', label: 'nord', group: 'dark' },
	{ id: 'gruvbox', label: 'gruvbox', group: 'dark' },
	{ id: 'one-dark', label: 'one dark', group: 'dark' },
	{ id: 'solarized', label: 'solarized', group: 'dark' },
	{ id: 'kanagawa', label: 'kanagawa', group: 'dark' },
	{ id: 'rose-pine', label: 'rose pine', group: 'dark' },
	{ id: 'vesper', label: 'vesper', group: 'dark' },
	{ id: 'catppuccin-latte', label: 'catppuccin latte', group: 'light' },
	{ id: 'terminal-light', label: 'terminal light', group: 'light' },
	{ id: 'tokyo-day', label: 'tokyo day', group: 'light' },
	{ id: 'gruvbox-light', label: 'gruvbox light', group: 'light' },
	{ id: 'one-light', label: 'one light', group: 'light' },
	{ id: 'solarized-light', label: 'solarized light', group: 'light' },
	{ id: 'kanagawa-lotus', label: 'kanagawa lotus', group: 'light' },
	{ id: 'rose-pine-dawn', label: 'rose pine dawn', group: 'light' }
];

const DEFAULT_THEME = 'terminal';

function getInitialTheme(): string {
	if (typeof document === 'undefined') return DEFAULT_THEME;
	const attr = document.documentElement.getAttribute('data-theme');
	return attr && THEMES.some((t) => t.id === attr) ? attr : DEFAULT_THEME;
}

let theme = $state<string>(getInitialTheme());

export function getThemeId(): string {
	return theme;
}

export function getThemeMeta(): ThemeMeta {
	return THEMES.find((t) => t.id === theme) ?? THEMES[1];
}

export function previewTheme(id: string): void {
	if (!THEMES.some((t) => t.id === id)) return;
	theme = id;
	document.documentElement.setAttribute('data-theme', id);
}

export function setTheme(id: string): void {
	previewTheme(id);
	localStorage.setItem('theme', id);
}
