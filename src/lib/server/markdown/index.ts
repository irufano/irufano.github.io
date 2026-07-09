import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatexImport from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import type { Root as HastRoot } from 'hast';

// unified's `.use()` overload resolution loses track of rehype-katex's option
// type this deep into a plugin chain; re-typing it locally keeps the chain sound.
const rehypeKatex = rehypeKatexImport as Plugin<[{ throwOnError?: boolean }?], HastRoot, HastRoot>;
import { remarkShiki, codeHandler } from './remark-shiki';
import { remarkReferences } from './remark-references';
import { remarkSanitizeMath } from './remark-sanitize-math';
import { remarkPromoteDisplayMath } from './remark-promote-display-math';
import { rehypeCallouts } from './rehype-callouts';
import { rehypeWrapTables } from './rehype-wrap-tables';
import { rehypeToc, type TocItem } from './rehype-toc';

export type { TocItem };

export interface RenderedMarkdown {
	html: string;
	toc: TocItem[];
}

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkMath)
	.use(remarkPromoteDisplayMath)
	.use(remarkSanitizeMath)
	.use(remarkReferences)
	.use(remarkShiki)
	.use(remarkRehype, { allowDangerousHtml: false, handlers: { code: codeHandler } })
	.use(rehypeKatex, { throwOnError: false })
	.use(rehypeSlug)
	.use(rehypeCallouts)
	.use(rehypeWrapTables)
	.use(rehypeToc)
	.use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
	const file = await processor.process(markdown);
	return {
		html: String(file),
		toc: (file.data.toc as TocItem[]) ?? []
	};
}
