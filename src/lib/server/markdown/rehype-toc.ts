import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

export interface TocItem {
	id: string;
	text: string;
	depth: 2 | 3;
}

/** Collects `h2`/`h3` headings (after rehype-slug has assigned ids) into `file.data.toc`. */
export const rehypeToc: Plugin<[], Root> = function rehypeToc() {
	return (tree, file) => {
		const toc: TocItem[] = [];
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'h2' && node.tagName !== 'h3') return;
			const id = typeof node.properties?.id === 'string' ? node.properties.id : undefined;
			if (!id) return;
			toc.push({ id, text: toString(node), depth: node.tagName === 'h2' ? 2 : 3 });
		});
		file.data.toc = toc;
	};
}
