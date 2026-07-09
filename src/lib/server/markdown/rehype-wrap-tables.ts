import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

/**
 * Wraps every `<table>` in a `.table-wrapper` div so wide tables get a
 * contained horizontal scrollbar on small screens instead of overflowing
 * the page. Applying `overflow-x: auto` to the table itself doesn't work
 * because a table's box shrink-wraps to its content rather than being
 * constrained to the container width.
 */
export const rehypeWrapTables: Plugin<[], Root> = function rehypeWrapTables() {
	return (tree) => {
		visit(tree, 'element', (node: Element, index, parent) => {
			if (node.tagName !== 'table' || !parent || index === undefined) return;

			const wrapper: Element = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['table-wrapper'] },
				children: [node]
			};

			parent.children[index] = wrapper;
		});
	};
};
