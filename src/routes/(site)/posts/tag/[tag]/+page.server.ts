import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { getPostsByTag, getTagBySlug, getTagParams } from '$lib/server/posts';

export const prerender = true;

export const entries: EntryGenerator = () => getTagParams();

export const load: PageServerLoad = ({ params }) => {
	const tag = getTagBySlug(params.tag);
	if (!tag) error(404, 'Tag not found');
	return {
		tag,
		posts: getPostsByTag(params.tag)
	};
};
