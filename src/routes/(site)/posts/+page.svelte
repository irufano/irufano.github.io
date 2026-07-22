<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import PostCard from "$lib/components/PostCard.svelte";
  import { SITE_URL, DEFAULT_OG_IMAGE } from "$lib/seo";
  import type { PageData } from "./$types";

  const PAGE_SIZE = 8;
  const title = "Posts - irufano";
  const description = "Developer notes, tutorials, and docs.";

  let { data }: { data: PageData } = $props();

  let query = $state("");
  let activeCategory = $state("");
  let categoryQuery = $state("");
  let page = $state(1);
  let searchScopedToCategory = $state(false);
  let categoriesOpen = $state(false);

  // query params can't be read during prerendering, so pick them up on mount
  onMount(() => {
    const params = new URL(window.location.href).searchParams;
    query = params.get("q") ?? "";
    activeCategory = params.get("category") ?? "";
    const parsedPage = Number(params.get("page"));
    page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory) params.set("category", activeCategory);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    goto(search ? `?${search}` : "?", {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  }

  function selectCategory(slug: string) {
    activeCategory = activeCategory === slug ? "" : slug;
    searchScopedToCategory = false;
    page = 1;
    syncUrl();
  }

  function handleSearchInput() {
    page = 1;
    syncUrl();
  }

  function goToPage(target: number) {
    page = Math.min(Math.max(1, target), totalPages);
    syncUrl();
  }

  const selectedCategoryLabel = $derived(
    activeCategory
      ? (data.categories.find((category) => category.slug === activeCategory)
          ?.name ?? "All")
      : "All",
  );

  const filteredCategories = $derived(
    data.categories.filter(
      (category) =>
        !categoryQuery.trim() ||
        category.name
          .toLowerCase()
          .includes(categoryQuery.trim().toLowerCase()),
    ),
  );

  const filteredPosts = $derived(
    data.posts.filter((post) => {
      const hasQuery = query.trim().length > 0;
      const matchesCategory =
        !activeCategory || post.categorySlug === activeCategory;
      const matchesQuery =
        !hasQuery ||
        post.title.toLowerCase().includes(query.trim().toLowerCase());

      // while searching, only enforce the category filter if the user opted
      // into a category-scoped search - otherwise search spans all posts
      const categoryFilterApplies = !hasQuery || searchScopedToCategory;

      return matchesQuery && (categoryFilterApplies ? matchesCategory : true);
    }),
  );

  const totalPages = $derived(
    Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE)),
  );

  const paginatedPosts = $derived(
    filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );

  // clamp if a filter change shrinks the result set below the current page
  $effect(() => {
    if (page > totalPages) page = totalPages;
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="{SITE_URL}/posts" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="{SITE_URL}/posts" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={DEFAULT_OG_IMAGE} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section
  class="w-full flex-1 overflow-y-auto px-4 py-10 sm:px-6 scrollbar-gutter-stable"
>
  <div class="mx-auto w-full max-w-6xl">
    <div class="mb-8">
      <h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">
        Posts
      </h1>
      <p class="mt-2 text-sm text-fg-muted">
        Developer notes and documentations.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <div class="flex flex-col gap-4 lg:sticky lg:top-0">
          <button
            type="button"
            onclick={() => (categoriesOpen = !categoriesOpen)}
            aria-expanded={categoriesOpen}
            aria-controls="categories-filter categories-list"
            class="order-1 flex w-full items-center justify-between font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted lg:order-2 lg:pointer-events-none lg:cursor-default"
          >
            <span>Categories</span>
            <span class="flex items-center gap-4 justify-between">
              {#if !categoriesOpen}
                <span
                  class="rounded-none bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold normal-case tracking-normal text-accent-fg lg:hidden"
                >
                  {selectedCategoryLabel}
                </span>
              {/if}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-3 w-3 shrink-0 transition-transform lg:hidden {categoriesOpen
                  ? 'rotate-180'
                  : ''}"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </span>
          </button>

          <div
            id="categories-filter"
            class="relative order-2 lg:order-1 {categoriesOpen
              ? 'block'
              : 'hidden'} lg:block"
          >
            <span
              class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
            >
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
              placeholder="Filter categories..."
              bind:value={categoryQuery}
              class="w-full rounded-none border border-border bg-bg-alt py-2 pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
          </div>

          <nav
            id="categories-list"
            class="order-3 flex-col gap-0.5 {categoriesOpen
              ? 'flex'
              : 'hidden'} lg:flex"
          >
            <button
              onclick={() => selectCategory("")}
              class="flex items-center justify-between rounded-none px-3 py-1.5 text-left font-mono text-xs transition cursor-pointer {activeCategory ===
              ''
                ? 'bg-accent text-accent-fg'
                : 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
            >
              <span>All</span>
              <span>{data.posts.length}</span>
            </button>
            {#each filteredCategories as category (category.slug)}
              <button
                onclick={() => selectCategory(category.slug)}
                class="flex items-center justify-between rounded-none px-3 py-1.5 text-left font-mono text-xs transition cursor-pointer {activeCategory ===
                category.slug
                  ? 'bg-accent text-accent-fg'
                  : 'text-fg-muted hover:bg-bg-alt hover:text-fg'}"
              >
                <span>{category.name}</span>
                <span>{category.count}</span>
              </button>
            {/each}
            {#if !filteredCategories.length}
              <p class="px-3 py-2 text-xs text-fg-muted">
                No categories found.
              </p>
            {/if}
          </nav>
        </div>
      </aside>

      <div>
        <div class="relative {activeCategory ? 'mb-3' : 'mb-6'}">
          <span
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          >
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
            placeholder="Search posts by name..."
            bind:value={query}
            oninput={handleSearchInput}
            class="w-full rounded-none border border-border bg-bg-alt py-2 pl-10 pr-4 text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </div>

        {#if activeCategory}
          {@const activeCategoryName = data.categories.find(
            (category) => category.slug === activeCategory,
          )?.name}
          <label
            class="mb-6 ml-2 flex w-fit items-center gap-2 text-xs text-fg-muted"
          >
            <input
              type="checkbox"
              bind:checked={searchScopedToCategory}
              onchange={() => {
                page = 1;
                syncUrl();
              }}
              class="h-3.5 w-3.5 accent-accent"
            />
            Search only in "{activeCategoryName}"
          </label>
        {/if}

        {#if filteredPosts.length}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {#each paginatedPosts as post (post.slug + post.categorySlug)}
              <PostCard {post} />
            {/each}
          </div>

          {#if totalPages > 1}
            <nav
              aria-label="Pagination"
              class="mt-8 flex items-center justify-center gap-1.5"
            >
              <button
                onclick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
                class="rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                &larr;
              </button>
              {#each { length: totalPages } as _, i (i)}
                <button
                  onclick={() => goToPage(i + 1)}
                  class="min-w-8 rounded-none border px-2.5 py-1.5 font-mono text-xs transition cursor-pointer {page ===
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
                class="rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                &rarr;
              </button>
            </nav>
          {/if}
        {:else}
          <div
            class="rounded-none border border-dashed border-border py-16 text-center text-sm text-fg-muted"
          >
            No posts found{query ? ` for "${query}"` : ""}.
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
