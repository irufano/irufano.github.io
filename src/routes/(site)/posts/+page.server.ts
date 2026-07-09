import type { PageServerLoad } from './$types';
import { getAllPosts, getAllCategories } from '$lib/server/posts';

export const prerender = true;

export const load: PageServerLoad = () => {
	return {
		posts: getAllPosts(),
		categories: getAllCategories()
	};
};
