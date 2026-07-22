import { visit } from 'unist-util-visit';
import { codeToHast } from 'shiki';
import type { Plugin } from 'unified';
import type { Handler } from 'mdast-util-to-hast';
import type { Root, Code } from 'mdast';
import type { Element, ElementContent, Text } from 'hast';

const SHIKI_THEME = 'material-theme';

interface CodeMeta {
	title?: string;
	lineNumbers: boolean;
	lineStart: number;
	highlight: Set<number>;
}

function parseMeta(meta: string | null | undefined): CodeMeta {
	const raw = meta ?? '';
	const titleMatch = /title="([^"]*)"/.exec(raw);
	const lineNumbers = /line-number=true/.test(raw);
	const lineStartMatch = /line-start=(\d+)/.exec(raw);
	const highlightMatch = /highlight=\{([^}]*)\}/.exec(raw);

	const highlight = new Set<number>();
	if (highlightMatch) {
		for (const part of highlightMatch[1].split(',')) {
			const trimmed = part.trim();
			const rangeMatch = /^(\d+)-(\d+)$/.exec(trimmed);
			if (rangeMatch) {
				const start = Number(rangeMatch[1]);
				const end = Number(rangeMatch[2]);
				for (let i = start; i <= end; i++) highlight.add(i);
			} else if (trimmed) {
				highlight.add(Number(trimmed));
			}
		}
	}

	return {
		title: titleMatch?.[1],
		lineNumbers,
		lineStart: lineStartMatch ? Number(lineStartMatch[1]) : 1,
		highlight
	};
}

function isLineElement(node: ElementContent): node is Element {
	if (node.type !== 'element') return false;
	const className = node.properties?.className;
	return Array.isArray(className) && className.includes('line');
}

function textNode(value: string): Text {
	return { type: 'text', value };
}

function svgIcon(className: string, children: Element[]): Element {
	return {
		type: 'element',
		tagName: 'svg',
		properties: {
			className: [className],
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			strokeWidth: '1.75',
			strokeLinecap: 'round',
			strokeLinejoin: 'round'
		},
		children
	};
}

// matches the copy/check icon pair already used by CodeTabs.svelte
const copyIcon = svgIcon('copy-icon', [
	{ type: 'element', tagName: 'rect', properties: { x: '9', y: '9', width: '11', height: '11', rx: '2' }, children: [] },
	{ type: 'element', tagName: 'path', properties: { d: 'M5 15V5a2 2 0 0 1 2-2h10' }, children: [] }
]);

const checkIcon = svgIcon('check-icon', [
	{ type: 'element', tagName: 'path', properties: { d: 'm5 12 5 5L20 7' }, children: [] }
]);

function makeHeader(meta: CodeMeta, lang: string): Element {
	const label: Element = {
		type: 'element',
		tagName: 'span',
		properties: { className: [meta.title ? 'code-block-title' : 'code-block-lang'] },
		children: [textNode(meta.title ?? lang)]
	};
	const copyBtn: Element = {
		type: 'element',
		tagName: 'button',
		properties: { type: 'button', className: ['copy-code-btn'], 'aria-label': 'Copy code' },
		children: [copyIcon, checkIcon]
	};
	return {
		type: 'element',
		tagName: 'div',
		properties: { className: ['code-block-header'] },
		children: [label, copyBtn]
	};
}

/**
 * mdast-util-to-hast's built-in `code` handler always wraps its result in a
 * fresh, unstyled `<pre>` *after* applying `data.hName`/`hProperties`, so a
 * `hName: 'div'` override from remarkShiki still ends up nested inside a
 * stray `<pre>` (visible as a second, oddly-padded box behind the real
 * code-block card). Overriding the handler entirely avoids that extra wrap.
 */
export const codeHandler: Handler = (state, node) => {
	const codeNode = node as Code;
	const data = codeNode.data as
		| { hName?: string; hProperties?: Element['properties']; hChildren?: ElementContent[] }
		| undefined;

	const result: Element = {
		type: 'element',
		tagName: data?.hName ?? 'pre',
		properties: data?.hProperties ?? {},
		children: data?.hChildren ?? [textNode(codeNode.value)]
	};
	state.patch(codeNode, result);
	return result;
};

export const remarkShiki: Plugin<[], Root> = function remarkShiki() {
	return async (tree) => {
		const codeNodes: Code[] = [];
		visit(tree, 'code', (node) => {
			codeNodes.push(node as Code);
		});

		for (const node of codeNodes) {
			const lang = node.lang || 'text';

			if (lang === 'mermaid') {
				node.data = {
					...node.data,
					hName: 'div',
					hProperties: { className: ['mermaid-block', 'not-prose'], 'data-mermaid': node.value },
					hChildren: [textNode(node.value)]
				};
				continue;
			}

			const meta = parseMeta(node.meta);

			let hast;
			try {
				hast = await codeToHast(node.value, { lang, theme: SHIKI_THEME });
			} catch {
				hast = await codeToHast(node.value, { lang: 'text', theme: SHIKI_THEME });
			}

			const preEl = hast.children[0] as Element;
			const codeEl = preEl.children.find(
				(c): c is Element => c.type === 'element' && c.tagName === 'code'
			);
			if (!codeEl) continue;

			const lineEls = codeEl.children.filter(isLineElement);
			lineEls.forEach((line, i) => {
				const lineNumber = i + 1;
				if (meta.highlight.has(lineNumber)) {
					line.properties = line.properties ?? {};
					const classes = Array.isArray(line.properties.className)
						? (line.properties.className as string[])
						: [];
					line.properties.className = [...classes, 'line-highlight'];
				}
			});

			preEl.properties = preEl.properties ?? {};
			const preClasses = Array.isArray(preEl.properties.className)
				? (preEl.properties.className as string[])
				: [];
			if (meta.lineNumbers) {
				preEl.properties.className = [...preClasses, 'line-numbers'];
				const existingStyle = typeof preEl.properties.style === 'string' ? preEl.properties.style : '';
				preEl.properties.style = `${existingStyle};counter-reset: line ${meta.lineStart - 1};`;
			}

			// mirror shiki's own background onto the wrapper so the header row
			// and the code area always share the exact same color, regardless
			// of which site theme is active - no seam between the two
			const preStyle = typeof preEl.properties.style === 'string' ? preEl.properties.style : '';
			const bgMatch = /background-color:\s*([^;]+)/.exec(preStyle);
			const wrapperStyle = bgMatch ? `background-color:${bgMatch[1]}` : undefined;

			node.data = {
				...node.data,
				hName: 'div',
				hProperties: {
					className: ['code-block', 'not-prose'],
					...(wrapperStyle ? { style: wrapperStyle } : {})
				},
				hChildren: [makeHeader(meta, lang), preEl]
			};
		}
	};
}
