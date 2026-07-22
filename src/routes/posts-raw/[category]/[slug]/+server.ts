import { error, text } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import { getPostParams, getPostRawContent } from '$lib/server/posts';

export const prerender = true;

export const entries: EntryGenerator = () => getPostParams();

export const GET: RequestHandler = ({ params }) => {
	const content = getPostRawContent(params.category, params.slug);
	if (content === undefined) error(404, 'Post not found');
	return text(content);
};
