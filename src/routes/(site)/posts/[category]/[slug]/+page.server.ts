import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { getPostBySlug, getPostParams } from '$lib/server/posts';

export const prerender = true;

export const entries: EntryGenerator = () => getPostParams();

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPostBySlug(params.category, params.slug);
	if (!post) error(404, 'Post not found');
	return { post };
};
