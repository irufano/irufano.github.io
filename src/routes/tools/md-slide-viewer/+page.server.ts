import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/server/posts';

export const prerender = true;

export const load: PageServerLoad = () => {
	const posts = getAllPosts().map((post) => ({
		title: post.title,
		category: post.category,
		categorySlug: post.categorySlug,
		slug: post.slug,
		date: post.date
	}));
	return { posts };
};
