<script lang="ts">
  import { goto } from "$app/navigation";
  import { getThemeMeta } from "$lib/theme.svelte";
  import { formatDate } from "$lib/utils/date";
  import { slugify } from "$lib/utils/slug";
  import { renderMermaidBlocks } from "$lib/client/mermaid";
  import { scrollToHeading } from "$lib/utils/scroll";
  import Toc from "$lib/components/Toc.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import "$lib/styles/post-content.css";
  import { SITE_URL, DEFAULT_OG_IMAGE } from "$lib/seo";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const pageTitle = $derived(`${data.post.title} — irufano`);
  const canonicalUrl = $derived(`${SITE_URL}/posts/${data.post.categorySlug}/${data.post.slug}`);
  const ogImage = $derived(data.post.image ?? DEFAULT_OG_IMAGE);
  const publishedDate = $derived(new Date(data.post.date).toISOString());
  const jsonLdScript = $derived.by(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.post.title,
      description: data.post.description,
      image: ogImage,
      datePublished: publishedDate,
      author: { "@type": "Person", name: data.post.author },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      url: canonicalUrl
    };
    return `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}<\/script>`;
  });

  let articleEl: HTMLElement | undefined = $state();
  let searchInputEl: HTMLInputElement | undefined = $state();
  let searchQuery = $state("");
  let isSearchFocused = $state(false);
  let matchCount = $state(0);
  let currentMatchIndex = $state(-1);
  let matches: HTMLElement[] = [];

  function handleGlobalKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isTyping =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    if (
      event.key === "/" &&
      !isTyping &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      searchInputEl?.focus();
      return;
    }

    if (event.key === "Escape" && document.activeElement === searchInputEl) {
      searchQuery = "";
      searchInputEl?.blur();
    }
  }

  $effect(() => {
    // re-render mermaid diagrams whenever the color theme group flips
    const group = getThemeMeta().group;
    void group;
    if (articleEl) renderMermaidBlocks(articleEl);
  });

  // re-read the search query whenever we land on a (new) post, so a shared
  // `?q=` link highlights on load, and switching posts doesn't carry over
  // a stale search into the new article
  let previousSlug: string | undefined;
  $effect(() => {
    const slug = data.post.slug;
    if (slug === previousSlug) return;
    previousSlug = slug;
    searchQuery = new URL(window.location.href).searchParams.get("q") ?? "";
  });

  function clearHighlights() {
    if (!articleEl) return;
    articleEl.querySelectorAll("mark.search-hit").forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(
        document.createTextNode(mark.textContent ?? ""),
        mark,
      );
      parent.normalize();
    });
    matches = [];
  }

  function highlightMatches(query: string): HTMLElement[] {
    if (!articleEl) return [];
    const needle = query.toLowerCase();
    const walker = document.createTreeWalker(articleEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement?.tagName;
        return tag === "SCRIPT" || tag === "STYLE"
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    const found: HTMLElement[] = [];
    for (const textNode of textNodes) {
      const text = textNode.textContent ?? "";
      const lowerText = text.toLowerCase();
      if (!lowerText.includes(needle)) continue;

      const frag = document.createDocumentFragment();
      let cursor = 0;
      let idx: number;
      while ((idx = lowerText.indexOf(needle, cursor)) !== -1) {
        if (idx > cursor)
          frag.appendChild(document.createTextNode(text.slice(cursor, idx)));
        const mark = document.createElement("mark");
        mark.className = "search-hit";
        mark.textContent = text.slice(idx, idx + query.length);
        frag.appendChild(mark);
        found.push(mark);
        cursor = idx + query.length;
      }
      if (cursor < text.length)
        frag.appendChild(document.createTextNode(text.slice(cursor)));
      textNode.parentNode?.replaceChild(frag, textNode);
    }
    return found;
  }

  function syncSearchUrl(query: string) {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    const search = url.searchParams.toString();
    goto(`${url.pathname}${search ? `?${search}` : ""}${url.hash}`, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  }

  function focusMatch(index: number) {
    if (!matches.length) return;
    matches[currentMatchIndex]?.classList.remove("search-hit-current");
    currentMatchIndex =
      ((index % matches.length) + matches.length) % matches.length;
    const el = matches[currentMatchIndex];
    el.classList.add("search-hit-current");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $effect(() => {
    const query = searchQuery.trim();
    const timeout = setTimeout(() => {
      if (!articleEl) return;
      clearHighlights();
      syncSearchUrl(query);
      if (!query) {
        matchCount = 0;
        currentMatchIndex = -1;
        return;
      }
      const found = highlightMatches(query);
      matches = found;
      matchCount = found.length;
      currentMatchIndex = found.length ? 0 : -1;
      if (found.length) {
        found[0].classList.add("search-hit-current");
        found[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
    return () => clearTimeout(timeout);
  });

  $effect(() => {
    // the article scrolls inside its own overflow container, so the browser's
    // native scroll-to-fragment on load/reload never reaches it — do it manually
    if (!articleEl || !window.location.hash) return;
    const target = document.getElementById(
      decodeURIComponent(window.location.hash.slice(1)),
    );
    if (target) scrollToHeading(target, "instant");
  });

  function handleArticleClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      ".heading-anchor",
    );
    if (anchor) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const id = decodeURIComponent(anchor.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", `#${id}`);
      scrollToHeading(target, "smooth");
      return;
    }

    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(
      ".copy-code-btn",
    );
    if (!btn) return;
    const code = btn.closest(".code-block")?.querySelector("code");
    if (!code) return;

    navigator.clipboard.writeText(code.innerText).then(() => {
      btn.dataset.copied = "true";
      setTimeout(() => {
        delete btn.dataset.copied;
      }, 1500);
    });
  }

  $effect(() => {
    if (!articleEl) return;
    articleEl.addEventListener("click", handleArticleClick);
    return () => articleEl?.removeEventListener("click", handleArticleClick);
  });

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    focusMatch(currentMatchIndex + 1);
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={data.post.description} />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:type" content="article" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={data.post.title} />
  <meta property="og:description" content={data.post.description} />
  <meta property="og:image" content={ogImage} />
  <meta property="article:published_time" content={publishedDate} />
  <meta property="article:author" content={data.post.author} />
  {#each data.post.tags as tag (tag)}
    <meta property="article:tag" content={tag} />
  {/each}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.post.title} />
  <meta name="twitter:description" content={data.post.description} />
  <meta name="twitter:image" content={ogImage} />

  {@html jsonLdScript}
</svelte:head>

<section class="w-full flex-1 overflow-y-auto scrollbar-gutter-stable">
  <div
    class="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_260px]"
  >
    <div class="flex min-w-0 flex-col">
      <article bind:this={articleEl} class="min-w-0">
        <header class="mb-8">
          <a
            href={`/posts?category=${data.post.categorySlug}`}
            class="font-mono text-xs text-accent hover:underline"
            >{data.post.category}</a
          >
          <h1
            class="mt-2 font-mono text-2xl font-extrabold text-fg sm:text-4xl"
          >
            {data.post.title}
          </h1>
          <div
            class="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-fg-muted"
          >
            <span>{data.post.author}</span>
            <span>&middot;</span>
            <time datetime={data.post.date}>{formatDate(data.post.date)}</time>
            <span>&middot;</span>
            <span>{data.post.readingTime} min read</span>
          </div>
          {#if data.post.tags.length}
            <div class="mt-3 flex flex-wrap gap-1.5">
              {#each data.post.tags as tag (tag)}
                <a
                  href={`/posts/tag/${slugify(tag)}`}
                  class="rounded-md bg-bg-alt px-2 py-0.5 font-mono text-[11px] text-fg-muted transition hover:text-accent hover:underline"
                >
                  {tag}
                </a>
              {/each}
            </div>
          {/if}
        </header>

        <div class="prose max-w-none">
          {@html data.post.html}
        </div>
      </article>

    </div>

    <aside class="hidden lg:block">
      <div
        class="sticky top-6 flex max-h-[calc(100dvh-10rem)] flex-col gap-6 pb-6"
      >
        <form onsubmit={submitSearch} class="relative">
          <input
            type="text"
            placeholder="Search in post..."
            bind:value={searchQuery}
            bind:this={searchInputEl}
            onfocus={() => (isSearchFocused = true)}
            onblur={() => (isSearchFocused = false)}
            class="w-full rounded-none border border-border bg-bg-alt py-2 pl-3 {searchQuery.trim()
              ? 'pr-24'
              : 'pr-8'} text-xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
          {#if searchQuery.trim()}
            <div
              class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1"
            >
              <span class="font-mono text-[10px] text-fg-muted">
                {matchCount ? `${currentMatchIndex + 1}/${matchCount}` : "0/0"}
              </span>
              <button
                type="button"
                aria-label="Previous match"
                disabled={!matchCount}
                onclick={() => focusMatch(currentMatchIndex - 1)}
                class="text-fg-muted hover:text-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="h-3 w-3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m18 15-6-6-6 6"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next match"
                disabled={!matchCount}
                onclick={() => focusMatch(currentMatchIndex + 1)}
                class="text-fg-muted hover:text-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="h-3 w-3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Clear search"
                onclick={() => (searchQuery = "")}
                class="text-fg-muted hover:text-accent"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="h-3 w-3"
                >
                  <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          {:else}
            <div
              class="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5"
            >
              {#if !isSearchFocused}
                <kbd
                  class="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg-muted"
                >
                  /
                </kbd>
              {/if}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-3.5 w-3.5 text-fg-muted"
              >
                <circle cx="11" cy="11" r="7" />
                <path stroke-linecap="round" d="m20 20-3.5-3.5" />
              </svg>
            </div>
          {/if}
        </form>

        <Toc items={data.post.toc} />
      </div>
    </aside>
  </div>
  <div class="mt-8">

	<Footer />
</div>
</section>
