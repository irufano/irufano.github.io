import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Literal } from 'mdast';
import type { ElementContent } from 'hast';

// Zero-width space/joiner/non-joiner + BOM - invisible, safe to drop entirely.
const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\uFEFF]/g;
// Non-breaking + other Unicode space variants KaTeX doesn't recognize -
// normalize to a regular space so the LaTeX parser can handle them.
const NBSP_RE = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

function sanitize(value: string): string {
	return value.replace(ZERO_WIDTH_RE, '').replace(NBSP_RE, ' ');
}

// `remark-math` (and remark-promote-display-math) stash a duplicate copy of
// the math source under `data.hChildren` to control the generated hast
// directly; `mdast-util-to-hast` renders from that copy, not from
// `node.value`, so it has to be sanitized too or the fix is a no-op.
function sanitizeHast(nodes: ElementContent[] | undefined): void {
	if (!nodes) return;
	for (const node of nodes) {
		if (node.type === 'text') {
			node.value = sanitize(node.value);
		} else if (node.type === 'element') {
			sanitizeHast(node.children);
		}
	}
}

/**
 * Copy-pasted math (from Word/Google Docs/etc.) often carries invisible
 * Unicode whitespace that KaTeX doesn't understand, spamming render warnings
 * or dropping characters silently. Strip it from math/inlineMath nodes only,
 * since these characters are often meaningful elsewhere (e.g. body text).
 */
export const remarkSanitizeMath: Plugin<[], Root> = function remarkSanitizeMath() {
	return (tree) => {
		visit(tree, ['math', 'inlineMath'], (node) => {
			const literal = node as Literal & { data?: { hChildren?: ElementContent[] } };
			literal.value = sanitize(literal.value);
			sanitizeHast(literal.data?.hChildren);
		});
	};
};
