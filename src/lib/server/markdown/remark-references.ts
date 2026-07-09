import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Plugin } from 'unified';
import type { Root, Paragraph, Text, PhrasingContent, Heading } from 'mdast';

const CITATION_RE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/** Reads a leading "[N]" off a paragraph's first child, unwrapping `**[N]**`/`*[N]*` too. */
function leadingRefNumber(node: PhrasingContent | undefined): string | undefined {
	if (!node) return undefined;
	const textNode: PhrasingContent | undefined =
		node.type === 'text' ? node : node.type === 'strong' || node.type === 'emphasis' ? node.children[0] : undefined;
	if (!textNode || textNode.type !== 'text') return undefined;
	return /^\[(\d+)\]/.exec(textNode.value)?.[1];
}

/**
 * Converts `[N]` / `[N, M]` inline citations into anchor links pointing at
 * `#ref-N`, and tags matching "[N] ..." paragraphs under a "## References"
 * heading with that same id — but only when a "## References" section
 * exists. Runs before remark-rehype, so it only ever touches mdast `text`
 * nodes, which naturally excludes fenced/inline code.
 */
export const remarkReferences: Plugin<[], Root> = function remarkReferences() {
	return (tree) => {
		let refHeadingIndex = -1;
		tree.children.forEach((node, i) => {
			if (
				node.type === 'heading' &&
				(node as Heading).depth === 2 &&
				toString(node).trim() === 'References'
			) {
				refHeadingIndex = i;
			}
		});
		if (refHeadingIndex === -1) return;

		let refEndIndex = tree.children.length;
		for (let i = refHeadingIndex + 1; i < tree.children.length; i++) {
			const node = tree.children[i];
			if (node.type === 'heading' && (node as Heading).depth <= 2) {
				refEndIndex = i;
				break;
			}
		}

		const definitionParagraphs = new Set<Paragraph>();
		const definedNumbers = new Set<string>();
		for (let i = refHeadingIndex + 1; i < refEndIndex; i++) {
			const node = tree.children[i];
			if (node.type !== 'paragraph') continue;
			const para = node as Paragraph;
			const number = leadingRefNumber(para.children[0]);
			if (!number) continue;
			definitionParagraphs.add(para);
			definedNumbers.add(number);
			para.data = { ...para.data, hProperties: { id: `ref-${number}` } };
		}
		if (!definedNumbers.size) return;

		visit(tree, 'text', (node, index, parent) => {
			if (!parent || index === undefined) return;
			if (parent.type === 'paragraph' && definitionParagraphs.has(parent as Paragraph)) return;

			const text = node as Text;
			CITATION_RE.lastIndex = 0;
			if (!CITATION_RE.test(text.value)) return;
			CITATION_RE.lastIndex = 0;

			const newNodes: PhrasingContent[] = [];
			let lastIndex = 0;
			let m: RegExpExecArray | null;
			let changed = false;
			while ((m = CITATION_RE.exec(text.value))) {
				const numbers = m[1].split(',').map((n) => n.trim());
				// only treat it as a citation if every number resolves to a real
				// reference — avoids false positives like "responses = [0, 1, 1]"
				if (!numbers.every((num) => definedNumbers.has(num))) continue;
				changed = true;

				if (m.index > lastIndex) {
					newNodes.push({ type: 'text', value: text.value.slice(lastIndex, m.index) });
				}
				numbers.forEach((num, idx) => {
					newNodes.push({
						type: 'link',
						url: `#ref-${num}`,
						children: [{ type: 'text', value: `[${num}]` }]
					});
					if (idx < numbers.length - 1) {
						newNodes.push({ type: 'text', value: ', ' });
					}
				});
				lastIndex = m.index + m[0].length;
			}
			if (!changed) return;
			if (lastIndex < text.value.length) {
				newNodes.push({ type: 'text', value: text.value.slice(lastIndex) });
			}

			parent.children.splice(index, 1, ...newNodes);
			return index + newNodes.length;
		});
	};
}
