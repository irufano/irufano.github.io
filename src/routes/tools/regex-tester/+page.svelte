<script lang="ts">
  import { SITE_URL, DEFAULT_OG_IMAGE } from "$lib/seo";

  const title = "Regex Tester — Tools — irufano";
  const description =
    "Test a regular expression against a string, see matches highlighted, and preview replacements.";
  const canonicalUrl = `${SITE_URL}/tools/regex-tester`;

  import Trash2 from "lucide-svelte/icons/trash-2";
  import Wand2 from "lucide-svelte/icons/wand-2";
  import CircleX from "lucide-svelte/icons/circle-x";
  import {
    regexTesterState,
    REGEX_EXAMPLE,
  } from "$lib/state/regex-tester.svelte";

  const FLAG_OPTIONS = [
    { key: "g", label: "Global" },
    { key: "i", label: "Ignore case" },
    { key: "m", label: "Multiline" },
    { key: "s", label: "Dot all" },
    { key: "u", label: "Unicode" },
    { key: "y", label: "Sticky" },
  ];

  let pattern = $state(regexTesterState.pattern);
  let flags = $state(regexTesterState.flags);
  let testString = $state(regexTesterState.testString);
  let replacement = $state(regexTesterState.replacement);

  $effect(() => {
    regexTesterState.pattern = pattern;
    regexTesterState.flags = flags;
    regexTesterState.testString = testString;
    regexTesterState.replacement = replacement;
  });

  function toggleFlag(key: string) {
    flags = flags.includes(key) ? flags.replace(key, "") : flags + key;
  }

  const regex = $derived.by(
    (): { ok: true; re: RegExp } | { ok: false; error: string } => {
      if (!pattern) return { ok: false, error: "" };
      try {
        return { ok: true, re: new RegExp(pattern, flags) };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    },
  );

  const matches = $derived.by(() => {
    if (!regex.ok || !testString) return [] as RegExpExecArray[];
    const re = regex.re;
    if (!re.flags.includes("g")) {
      const m = re.exec(testString);
      return m ? [m] : [];
    }
    const results: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(testString)) !== null && guard < 5000) {
      results.push(m);
      if (m[0] === "") re.lastIndex++;
      guard++;
    }
    return results;
  });

  const segments = $derived.by(() => {
    if (!testString) return [];
    if (!matches.length) return [{ text: testString, matched: false }];
    const parts: { text: string; matched: boolean }[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor)
        parts.push({ text: testString.slice(cursor, m.index), matched: false });
      parts.push({ text: m[0] || "​", matched: true });
      cursor = m.index + m[0].length;
    }
    if (cursor < testString.length)
      parts.push({ text: testString.slice(cursor), matched: false });
    return parts;
  });

  const replaced = $derived.by(() => {
    if (!regex.ok || !testString || !replacement) return "";
    try {
      return testString.replace(regex.re, replacement);
    } catch {
      return "";
    }
  });

  const groupCount = $derived(
    matches.reduce((sum, m) => sum + Math.max(0, m.length - 1), 0),
  );

  const summaryStats = $derived([
    { label: "Matches", value: matches.length },
    { label: "Groups", value: groupCount },
  ]);

  function loadExample() {
    pattern = REGEX_EXAMPLE.pattern;
    flags = REGEX_EXAMPLE.flags;
    testString = REGEX_EXAMPLE.testString;
  }

  function clearAll() {
    pattern = "";
    testString = "";
    replacement = "";
  }
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

<section class="w-full px-4 py-10 sm:px-6">
  <h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">
    Regex Tester
  </h1>
  <p class="mt-2 text-sm text-fg-muted">
    Write a pattern, test it against a string, and see every match highlighted
    as you type.
  </p>

  <div class="mt-8 grid grid-cols-2 gap-3 sm:max-w-xs">
    {#each summaryStats as stat (stat.label)}
      <div class="rounded-none border border-border bg-bg-alt p-3">
        <p class="font-mono text-lg font-bold text-accent sm:text-xl">
          {stat.value}
        </p>
        <p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
      </div>
    {/each}
  </div>

  <div class="mt-6 flex items-center justify-end">
    <div class="flex items-center gap-1">
      <button
        onclick={loadExample}
        class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
      >
        <Wand2 class="h-3.5 w-3.5" />
        Example
      </button>
      <button
        onclick={clearAll}
        disabled={!pattern && !testString}
        class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
      >
        <Trash2 class="h-3.5 w-3.5" />
        Clear
      </button>
    </div>
  </div>

  <div class="mt-4">
    <label
      for="regex-pattern"
      class="font-mono text-xs uppercase tracking-wide text-fg-muted"
    >
      Pattern
    </label>
    <div
      class="mt-2 flex items-stretch rounded-none border border-border bg-bg-alt"
    >
      <span class="flex items-center pl-3 font-mono text-sm text-fg-muted"
        >/</span
      >
      <input
        id="regex-pattern"
        bind:value={pattern}
        placeholder="[a-z]+"
        spellcheck="false"
        class="w-full bg-transparent px-2 py-2.5 font-mono text-sm text-fg placeholder:text-fg-muted focus:outline-none"
      />
      <span class="flex items-center pr-3 font-mono text-sm text-fg-muted"
        >/{flags}</span
      >
    </div>

    {#if !regex.ok && regex.error}
      <p class="mt-2 flex items-start gap-1.5 text-xs text-red-400">
        <CircleX class="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {regex.error}
      </p>
    {/if}

    <div class="mt-3 flex flex-wrap gap-1.5">
      {#each FLAG_OPTIONS as opt (opt.key)}
        <button
          onclick={() => toggleFlag(opt.key)}
          title={opt.label}
          class={`cursor-pointer rounded-none border px-2.5 py-1 font-mono text-xs transition ${
            flags.includes(opt.key)
              ? "border-accent bg-accent text-bg"
              : "border-border text-fg-muted hover:text-fg"
          }`}
        >
          {opt.key}
        </button>
      {/each}
    </div>
  </div>

  <div class="mt-6 grid gap-6 lg:grid-cols-2">
    <div>
      <label
        for="regex-test-string"
        class="font-mono text-xs uppercase tracking-wide text-fg-muted"
      >
        Test string
      </label>
      <textarea
        id="regex-test-string"
        bind:value={testString}
        placeholder="Paste text to test against your pattern..."
        rows="10"
        spellcheck="false"
        class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
      ></textarea>
    </div>

    <div>
      <p class="font-mono text-xs uppercase tracking-wide text-fg-muted">
        Highlighted matches
      </p>
      <div
        class="mt-2 min-h-[calc(10*1.5rem+2rem)] w-full overflow-y-auto rounded-none border border-border bg-bg-alt p-4 font-mono text-sm whitespace-pre-wrap wrap-break-word text-fg"
      >
        {#each segments as seg, i (i)}
          {#if seg.matched}
            <mark class="rounded-sm bg-accent/30 text-fg">{seg.text}</mark>
          {:else}
            {seg.text}
          {/if}
        {/each}
      </div>
    </div>
  </div>

  {#if matches.length}
    <div class="mt-6">
      <p class="font-mono text-xs uppercase tracking-wide text-fg-muted">
        Match list
      </p>
      <div class="mt-2 max-h-64 overflow-y-auto border border-border">
        {#each matches as m, i (i)}
          <div class="border-b border-border p-3 last:border-b-0">
            <div
              class="flex flex-wrap items-center gap-2 text-xs text-fg-muted"
            >
              <span class="font-mono text-accent">#{i + 1}</span>
              <span>at index {m.index}</span>
            </div>
            <p class="mt-1 break-all font-mono text-sm text-fg">
              {m[0] || "(empty match)"}
            </p>
            {#if m.length > 1}
              <div class="mt-1.5 flex flex-wrap gap-1.5">
                {#each m.slice(1) as group, gi (gi)}
                  <span
                    class="rounded-none border border-border px-2 py-0.5 font-mono text-xs text-fg-muted"
                  >
                    ${gi + 1}: {group ?? "(undefined)"}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="mt-6">
    <label
      for="regex-replacement"
      class="font-mono text-xs uppercase tracking-wide text-fg-muted"
    >
      Replacement (optional — use $1, $2 for groups)
    </label>
    <input
      id="regex-replacement"
      bind:value={replacement}
      placeholder="$&"
      spellcheck="false"
      class="mt-2 w-full rounded-none border border-border bg-bg-alt px-3 py-2.5 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
    />

    {#if replacement && replaced}
      <div class="mt-3">
        <p class="font-mono text-xs uppercase tracking-wide text-fg-muted">
          Result
        </p>
        <p
          class="mt-2 rounded-none border border-border bg-bg-alt p-4 font-mono text-sm whitespace-pre-wrap wrap-break-word text-fg"
        >
          {replaced}
        </p>
      </div>
    {/if}
  </div>
</section>
