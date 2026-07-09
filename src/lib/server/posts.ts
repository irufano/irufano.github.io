import matter from 'gray-matter';
import { slugify } from '$lib/utils/slug';
import { renderMarkdown, type TocItem } from './markdown';

export interface PostFrontmatter {
	title: string;
	date: string;
	description: string;
	author: string;
	tags: string[];
	image?: string;
}

export interface PostSummary extends PostFrontmatter {
	slug: string;
	category: string;
	categorySlug: string;
	readingTime: number;
}

export interface PostDetail extends PostSummary {
	html: string;
	toc: TocItem[];
}

export interface CategorySummary {
	name: string;
	slug: string;
	count: number;
}

export interface TagSummary {
	name: string;
	slug: string;
	count: number;
}

interface PostEntry {
	category: string;
	categorySlug: string;
	slug: string;
	frontmatter: PostFrontmatter;
	content: string;
	readingTime: number;
}

const rawModules = import.meta.glob('/posts/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function estimateReadingMinutes(text: string): number {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}

const entries: PostEntry[] = Object.entries(rawModules).map(([path, raw]) => {
	// path looks like /posts/<Category>/<post-dir>/<file>.md
	const parts = path.split('/').filter(Boolean);
	const category = parts[1];
	const dir = parts[2];
	const { data, content } = matter(raw);

	return {
		category,
		categorySlug: slugify(category),
		slug: dir,
		frontmatter: {
			title: data.title ?? dir,
			date: data.date ?? '',
			description: data.description ?? '',
			author: data.author ?? '',
			tags: Array.isArray(data.tags) ? data.tags : [],
			image: data.image
		},
		content,
		readingTime: estimateReadingMinutes(content)
	};
});

function toSummary(entry: PostEntry): PostSummary {
	return {
		...entry.frontmatter,
		slug: entry.slug,
		category: entry.category,
		categorySlug: entry.categorySlug,
		readingTime: entry.readingTime
	};
}

export function getAllPosts(): PostSummary[] {
	return entries.map(toSummary).sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getAllCategories(): CategorySummary[] {
	const map = new Map<string, CategorySummary>();
	for (const entry of entries) {
		const existing = map.get(entry.categorySlug);
		if (existing) {
			existing.count++;
		} else {
			map.set(entry.categorySlug, { name: entry.category, slug: entry.categorySlug, count: 1 });
		}
	}
	return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getPostParams(): { category: string; slug: string }[] {
	return entries.map((e) => ({ category: e.categorySlug, slug: e.slug }));
}

export function getAllTags(): TagSummary[] {
	const map = new Map<string, TagSummary>();
	for (const entry of entries) {
		for (const tag of entry.frontmatter.tags) {
			const slug = slugify(tag);
			const existing = map.get(slug);
			if (existing) {
				existing.count++;
			} else {
				map.set(slug, { name: tag, slug, count: 1 });
			}
		}
	}
	return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getTagParams(): { tag: string }[] {
	return getAllTags().map((tag) => ({ tag: tag.slug }));
}

export function getTagBySlug(tagSlug: string): TagSummary | undefined {
	return getAllTags().find((tag) => tag.slug === tagSlug);
}

export function getPostsByTag(tagSlug: string): PostSummary[] {
	return getAllPosts().filter((post) =>
		post.tags.some((tag) => slugify(tag) === tagSlug)
	);
}

export async function getPostBySlug(
	categorySlug: string,
	slug: string
): Promise<PostDetail | undefined> {
	const entry = entries.find((e) => e.categorySlug === categorySlug && e.slug === slug);
	if (!entry) return undefined;
	const { html, toc } = await renderMarkdown(entry.content);
	return { ...toSummary(entry), html, toc };
}
