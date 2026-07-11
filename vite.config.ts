import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static adapter: this repo is irufano/irufano.github.io, a user-page repo that
			// GitHub Pages serves from the domain root, so no base path is needed.
			// `fallback: '404.html'` emits a build/404.html containing the app shell, which
			// GitHub Pages serves (as a real 404) for any unmatched path — letting the
			// hydrated app render +error.svelte instead of GitHub's generic 404 page.
			adapter: adapter({
				fallback: '404.html'
			})
		})
	]
});
