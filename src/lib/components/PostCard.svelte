<script lang="ts">
	import type { PostSummary } from '$lib/server/posts';
	import { formatDate } from '$lib/utils/date';
	import { slugify } from '$lib/utils/slug';

	let { post }: { post: PostSummary } = $props();
</script>

<div
	class="group relative flex flex-col gap-3 rounded-none border border-border bg-bg-alt p-5 transition hover:border-accent/50"
>
	<div class="flex items-center gap-2 font-mono text-xs text-fg-muted">
		<span class="rounded-none border border-accent/25 px-2 py-0.5 text-accent">{post.category}</span>
		<span>&middot;</span>
		<time datetime={post.date}>{formatDate(post.date)}</time>
		<span>&middot;</span>
		<span>{post.readingTime} min read</span>
	</div>

	<h2 class="text-lg font-bold text-fg transition group-hover:text-accent sm:text-xl">
		<a href={`/posts/${post.categorySlug}/${post.slug}`} class="static after:absolute after:inset-0">
			{post.title}
		</a>
	</h2>

	<p class="line-clamp-2 text-sm text-fg-muted">{post.description}</p>

	{#if post.tags.length}
		<div class="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-1">
			{#each post.tags as tag (tag)}
				<a
					href={`/posts/tag/${slugify(tag)}`}
					class="rounded-md bg-bg px-2 py-0.5 font-mono text-[11px] text-fg-muted transition hover:text-accent hover:underline"
				>
					{tag}
				</a>
			{/each}
		</div>
	{/if}
</div>
