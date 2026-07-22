<script lang="ts">
  import { TOOLS, groupToolsByCategory } from "$lib/tools";
  import { SITE_URL, DEFAULT_OG_IMAGE } from "$lib/seo";
  import Search from "lucide-svelte/icons/search";

  const title = "Tools - irufano";
  const description = "A collection of small developer tools and utilities.";

  let query = $state("");

  let filteredGroups = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? TOOLS.filter(
          (tool) =>
            tool.label.toLowerCase().includes(q) ||
            tool.description.toLowerCase().includes(q),
        )
      : TOOLS;
    return groupToolsByCategory(filtered);
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="{SITE_URL}/tools" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="{SITE_URL}/tools" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={DEFAULT_OG_IMAGE} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section class="w-full px-4 py-10 sm:px-6">
  <h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Tools</h1>
  <p class="mt-2 text-sm text-fg-muted">
    A collection of some developer tools and utilities.
  </p>

  <div class="relative mt-6">
    <Search
      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
    />
    <input
      type="text"
      placeholder="Search tools..."
      bind:value={query}
      class="w-full rounded-none border border-border bg-bg-alt py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
    />
  </div>

  {#if filteredGroups.length}
    <div class="mt-8 space-y-8">
      {#each filteredGroups as group (group.category)}
        <div>
          <h2
            class="font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted"
          >
            {group.category}
          </h2>
          <div
            class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {#each group.tools as tool (tool.slug)}
              {@const Icon = tool.icon}
              <a
                href={`/tools/${tool.slug}`}
                class="group relative flex h-full flex-col gap-2 rounded-none border border-border bg-bg-alt p-5 transition hover:border-accent/50 hover:shadow-sm"
              >
                <div class="flex p-2 bg-accent/10 items-center w-min">
                  <Icon class="h-5 w-5 text-accent" />
                </div>
                <h3
                  class="font-mono text-base font-bold text-fg transition group-hover:text-accent"
                >
                  {tool.label}
                </h3>
                <p class="flex-1 text-sm text-fg-muted">{tool.description}</p>
                <span
                  class="flex items-center gap-1 pt-1 font-mono text-xs text-fg-muted transition group-hover:text-accent"
                >
                  Open tool
                  <span class="transition group-hover:translate-x-0.5"
                    >&rarr;</span
                  >
                </span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="mt-10 text-center text-sm text-fg-muted">
      No tools found for "{query}".
    </p>
  {/if}
</section>
