import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Appends a `#` anchor link to every heading that already has an `id`
 * (assigned by rehype-slug). Must run after rehype-toc, since rehype-toc
 * reads each heading's text/html for the TOC and shouldn't pick up the "#".
 */
export const rehypeHeadingLinks: Plugin<[], Root> = function rehypeHeadingLinks() {
	return (tree) => {
		visit(tree, 'element', (node: Element) => {
			if (!HEADING_TAGS.has(node.tagName)) return;
			const id = typeof node.properties?.id === 'string' ? node.properties.id : undefined;
			if (!id) return;

			const anchor: Element = {
				type: 'element',
				tagName: 'a',
				properties: {
					href: `#${id}`,
					className: ['heading-anchor'],
					ariaHidden: 'true',
					tabIndex: -1
				},
				children: [{ type: 'text', value: '#' }]
			};
			node.children.push(anchor);
		});
	};
};
