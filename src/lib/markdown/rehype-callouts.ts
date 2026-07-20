import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Element, Text } from 'hast';

const CALLOUT_TYPES = ['info', 'warning', 'tip', 'important', 'caution', 'note'] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];

// matches both this project's `[info]: ...` marker and GitHub's native
// `[!NOTE]` alert marker (https://github.com/orgs/community/discussions/16925)
const MARKER_RE = new RegExp(`^\\[(!)?(${CALLOUT_TYPES.join('|')})\\](:)?\\s*([\\s\\S]*)$`, 'i');

const LABELS: Record<CalloutType, string> = {
	info: 'Info',
	note: 'Note',
	tip: 'Tip',
	important: 'Important',
	warning: 'Warning',
	caution: 'Caution'
};

interface IconChild {
	tag: 'circle' | 'line' | 'path';
	attrs: Record<string, string>;
}

// simple stroke-based icons in the style already used elsewhere on the site
// (search/copy icons), one per callout type; `note` reuses `info`'s glyph
const ICON_PATHS: Record<CalloutType, IconChild[]> = {
	info: [
		{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
		{ tag: 'line', attrs: { x1: '12', y1: '16', x2: '12', y2: '11.5' } },
		{ tag: 'line', attrs: { x1: '12', y1: '8', x2: '12.01', y2: '8' } }
	],
	note: [
		{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
		{ tag: 'line', attrs: { x1: '12', y1: '16', x2: '12', y2: '11.5' } },
		{ tag: 'line', attrs: { x1: '12', y1: '8', x2: '12.01', y2: '8' } }
	],
	tip: [
		{ tag: 'path', attrs: { d: 'M9 18h6' } },
		{ tag: 'path', attrs: { d: 'M10 22h4' } },
		{
			tag: 'path',
			attrs: { d: 'M15 14c.2-1 .7-1.8 1.5-2.5A6 6 0 1 0 7.5 11.5c.8.7 1.3 1.5 1.5 2.5' }
		}
	],
	important: [
		{ tag: 'path', attrs: { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' } }
	],
	warning: [
		{
			tag: 'path',
			attrs: {
				d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
			}
		},
		{ tag: 'line', attrs: { x1: '12', y1: '9', x2: '12', y2: '13' } },
		{ tag: 'line', attrs: { x1: '12', y1: '17', x2: '12.01', y2: '17' } }
	],
	caution: [
		{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
		{ tag: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '12' } },
		{ tag: 'line', attrs: { x1: '12', y1: '16', x2: '12.01', y2: '16' } }
	]
};

function buildIcon(type: CalloutType): Element {
	return {
		type: 'element',
		tagName: 'svg',
		properties: {
			className: ['callout-icon'],
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			strokeWidth: '2',
			strokeLinecap: 'round',
			strokeLinejoin: 'round'
		},
		children: ICON_PATHS[type].map((child) => ({
			type: 'element',
			tagName: child.tag,
			properties: child.attrs,
			children: []
		}))
	};
}

/**
 * Turns `> [info]: ...` and GitHub-style `> [!NOTE]` blockquotes into
 * `<div class="callout callout-info">` blocks with a title header. This
 * project's own `note` marker renders without a header (per the markdown
 * spec in posts/Insights Docs/post-docs); GitHub's `[!NOTE]` always gets one,
 * matching GitHub's own rendering.
 */
export const rehypeCallouts: Plugin<[], Root> = function rehypeCallouts() {
	return (tree) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'blockquote') return;

			const firstEl = node.children.find((c): c is Element => c.type === 'element');
			if (!firstEl || firstEl.tagName !== 'p') return;

			const firstText = firstEl.children.find((c): c is Text => c.type === 'text');
			if (!firstText) return;

			const match = MARKER_RE.exec(firstText.value);
			if (!match) return;

			const isGithubStyle = Boolean(match[1]);
			const type = match[2].toLowerCase() as CalloutType;
			const rest = match[4];
			firstText.value = rest;

			const isNowEmpty = rest.trim() === '' && !firstEl.children.some((c) => c.type === 'element');
			if (isNowEmpty) {
				node.children.splice(node.children.indexOf(firstEl), 1);
			}

			node.tagName = 'div';
			node.properties = { ...node.properties, className: ['callout', `callout-${type}`] };

			if (isGithubStyle || type !== 'note') {
				const header: Element = {
					type: 'element',
					tagName: 'div',
					properties: { className: ['callout-title'] },
					children: [
						buildIcon(type),
						{
							type: 'element',
							tagName: 'span',
							properties: {},
							children: [{ type: 'text', value: LABELS[type] }]
						}
					]
				};
				node.children.unshift(header);
			}
		});
	};
}
