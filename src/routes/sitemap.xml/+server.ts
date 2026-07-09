import type { RequestHandler } from './$types';
import { getAllPosts, getAllTags } from '$lib/server/posts';
import { TOOLS } from '$lib/tools';
import { SITE_URL } from '$lib/seo';

export const prerender = true;

interface SitemapUrl {
	loc: string;
	lastmod?: string;
	changefreq: 'daily' | 'weekly' | 'monthly';
	priority: string;
}

function toIsoDate(value: string): string | undefined {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

function render(urls: SitemapUrl[]): string {
	const body = urls
		.map(
			(url) => `\t<url>
\t\t<loc>${url.loc}</loc>
${url.lastmod ? `\t\t<lastmod>${url.lastmod}</lastmod>\n` : ''}\t\t<changefreq>${url.changefreq}</changefreq>
\t\t<priority>${url.priority}</priority>
\t</url>`
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export const GET: RequestHandler = () => {
	const posts = getAllPosts();
	const tags = getAllTags();

	const urls: SitemapUrl[] = [
		{ loc: `${SITE_URL}/`, changefreq: 'monthly', priority: '1.0' },
		{ loc: `${SITE_URL}/posts`, changefreq: 'daily', priority: '0.8' },
		{ loc: `${SITE_URL}/tools`, changefreq: 'weekly', priority: '0.8' },
		...posts.map((post) => ({
			loc: `${SITE_URL}/posts/${post.categorySlug}/${post.slug}`,
			lastmod: toIsoDate(post.date),
			changefreq: 'monthly' as const,
			priority: '0.7'
		})),
		...tags.map((tag) => ({
			loc: `${SITE_URL}/posts/tag/${tag.slug}`,
			changefreq: 'weekly' as const,
			priority: '0.5'
		})),
		...TOOLS.map((tool) => ({
			loc: `${SITE_URL}/tools/${tool.slug}`,
			changefreq: 'monthly' as const,
			priority: '0.6'
		}))
	];

	return new Response(render(urls), {
		headers: { 'Content-Type': 'application/xml' }
	});
};
