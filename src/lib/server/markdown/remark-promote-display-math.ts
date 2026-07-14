import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Paragraph, PhrasingContent } from 'mdast';
import type { Math } from 'mdast-util-math';

/**
 * `remark-math` only recognizes `$$...$$` as display math when the fences
 * sit on their own lines. A single-line `$$formula$$` falls back to inline
 * math (micromark's math-flow tokenizer rejects a `$` inside the meta/info
 * part of the opening fence), so it never gets KaTeX's `.katex-display`
 * wrapper and renders left-aligned like ordinary text. Since `$$` is only
 * ever used in these posts to mean "this is its own equation," promote any
 * paragraph whose sole content is a `$$`-delimited inline-math node to real
 * display math, matching what multi-line `$$\n...\n$$` already produces —
 * except left-aligned (via the `math-display-left` wrapper class) rather
 * than centered, so single-line `$$...$$` stays visually distinct from a
 * genuine multi-line `$$` block.
 */
export const remarkPromoteDisplayMath: Plugin<[], Root> = function remarkPromoteDisplayMath() {
	return (tree, file) => {
		const source = String(file.value);

		visit(tree, 'paragraph', (node, index, parent) => {
			if (!parent || index === undefined) return;

			const para = node as Paragraph;
			const children = para.children.filter(
				(child) => !(child.type === 'text' && child.value.trim() === '')
			);
			if (children.length !== 1 || children[0].type !== 'inlineMath') return;

			const inline = children[0] as PhrasingContent & { value: string };
			const start = inline.position?.start.offset;
			if (start === undefined || source.slice(start, start + 2) !== '$$') return;

			const mathNode: Math = {
				type: 'math',
				meta: null,
				value: inline.value,
				data: {
					hName: 'div',
					hProperties: { className: ['math-display-left'] },
					hChildren: [
						{
							type: 'element',
							tagName: 'pre',
							properties: {},
							children: [
								{
									type: 'element',
									tagName: 'code',
									properties: { className: ['language-math', 'math-display'] },
									children: [{ type: 'text', value: inline.value }]
								}
							]
						}
					]
				}
			};

			parent.children.splice(index, 1, mathNode as unknown as PhrasingContent);
		});
	};
};
