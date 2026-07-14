import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import { toHtml } from 'hast-util-to-html';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

export interface TocItem {
	id: string;
	text: string;
	html: string;
	depth: 2 | 3 | 4;
}

const HEADING_DEPTH: Record<string, 2 | 3 | 4> = { h2: 2, h3: 3, h4: 4 };

/** Collects `h2`/`h3`/`h4` headings (after rehype-slug has assigned ids) into `file.data.toc`. */
export const rehypeToc: Plugin<[], Root> = function rehypeToc() {
	return (tree, file) => {
		const toc: TocItem[] = [];
		visit(tree, 'element', (node: Element) => {
			const depth = HEADING_DEPTH[node.tagName];
			if (!depth) return;
			const id = typeof node.properties?.id === 'string' ? node.properties.id : undefined;
			if (!id) return;
			const html = toHtml({ type: 'root', children: node.children ?? [] });
			toc.push({ id, text: toString(node), html, depth });
		});
		file.data.toc = toc;
	};
}
