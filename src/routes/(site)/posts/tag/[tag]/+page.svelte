<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PostCard from '$lib/components/PostCard.svelte';
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';
	import type { PageData } from './$types';

	const PAGE_SIZE = 8;

	let { data }: { data: PageData } = $props();

	const title = $derived(`#${data.tag.name} — Posts — irufano`);
	const description = $derived(`Posts tagged "${data.tag.name}".`);
	const canonicalUrl = $derived(`${SITE_URL}/posts/tag/${data.tag.slug}`);

	let query = $state('');
	let page = $state(1);

	// query params can't be read during prerendering, so pick them up on mount
	onMount(() => {
		const params = new URL(window.location.href).searchParams;
		query = params.get('q') ?? '';
		const parsedPage = Number(params.get('page'));
		page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
	});

	function syncUrl() {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (page > 1) params.set('page', String(page));
		const search = params.toString();
		goto(search ? `?${search}` : '?', { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleSearchInput() {
		page = 1;
		syncUrl();
	}

	function goToPage(target: number) {
		page = Math.min(Math.max(1, target), totalPages);
		syncUrl();
	}

	const filteredPosts = $derived(
		data.posts.filter(
			(post) => !query.trim() || post.title.toLowerCase().includes(query.trim().toLowerCase())
		)
	);

	const totalPages = $derived(Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE)));

	const paginatedPosts = $derived(filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));

	// clamp if a search change shrinks the result set below the current page
	$effect(() => {
		if (page > totalPages) page = totalPages;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section class="w-full flex-1 overflow-y-auto px-4 py-10 sm:px-6 scrollbar-gutter-stable">
	<div class="mx-auto w-full max-w-6xl">
		<div class="mb-8">
			<a href="/posts" class="font-mono text-xs text-accent hover:underline">&larr; All posts</a>
			<h1 class="mt-2 font-mono text-2xl font-extrabold text-fg sm:text-3xl">
				#{data.tag.name}
			</h1>
			<p class="mt-2 text-sm text-fg-muted">
				{data.tag.count} post{data.tag.count === 1 ? '' : 's'} tagged "{data.tag.name}".
			</p>
		</div>

		<div class="relative mb-6">
			<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="h-3.5 w-3.5"
				>
					<circle cx="11" cy="11" r="7" />
					<path stroke-linecap="round" d="m20 20-3.5-3.5" />
				</svg>
			</span>
			<input
				type="text"
				placeholder={`Search posts tagged "${data.tag.name}"...`}
				bind:value={query}
				oninput={handleSearchInput}
				class="w-full rounded-none border border-border bg-bg-alt py-2 pl-10 pr-4 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			/>
		</div>

		{#if filteredPosts.length}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each paginatedPosts as post (post.slug + post.categorySlug)}
					<PostCard {post} />
				{/each}
			</div>

			{#if totalPages > 1}
				<nav aria-label="Pagination" class="mt-8 flex items-center justify-center gap-1.5">
					<button
						onclick={() => goToPage(page - 1)}
						disabled={page === 1}
						aria-label="Previous page"
						class="cursor-pointer rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
					>
						&larr;
					</button>
					{#each { length: totalPages } as _, i (i)}
						<button
							onclick={() => goToPage(i + 1)}
							class="min-w-8 cursor-pointer rounded-none border px-2.5 py-1.5 font-mono text-xs transition {page ===
							i + 1
								? 'border-accent bg-accent text-accent-fg'
								: 'border-border text-fg-muted hover:border-accent/50 hover:text-fg'}"
						>
							{i + 1}
						</button>
					{/each}
					<button
						onclick={() => goToPage(page + 1)}
						disabled={page === totalPages}
						aria-label="Next page"
						class="cursor-pointer rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
					>
						&rarr;
					</button>
				</nav>
			{/if}
		{:else}
			<div
				class="rounded-none border border-dashed border-border py-16 text-center text-sm text-fg-muted"
			>
				No posts found{query ? ` for "${query}"` : ''}.
			</div>
		{/if}
	</div>
</section>
