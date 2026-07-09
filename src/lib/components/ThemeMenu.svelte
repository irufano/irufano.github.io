<script lang="ts">
  import { tick } from "svelte";
  import {
    THEMES,
    getThemeId,
    getThemeMeta,
    previewTheme,
    setTheme,
  } from "$lib/theme.svelte";

  let open = $state(false);
  let focusIndex = $state(0);
  let originalTheme = "";
  let itemEls: HTMLButtonElement[] = [];

  const groups: { label: string; items: typeof THEMES }[] = [
    { label: "dark", items: THEMES.filter((t) => t.group === "dark") },
    { label: "light", items: THEMES.filter((t) => t.group === "light") },
  ];

  function openMenu() {
    originalTheme = getThemeId();
    focusIndex = THEMES.findIndex((t) => t.id === originalTheme);
    if (focusIndex < 0) focusIndex = 0;
    open = true;
    tick().then(() =>
      itemEls[focusIndex]?.scrollIntoView({ block: "nearest" }),
    );
  }

  function cancelMenu() {
    previewTheme(originalTheme);
    open = false;
  }

  function confirm(id: string) {
    setTheme(id);
    open = false;
  }

  function focusAndPreview(index: number) {
    focusIndex = index;
    previewTheme(THEMES[index].id);
  }

  function move(delta: number) {
    const index = (focusIndex + delta + THEMES.length) % THEMES.length;
    focusAndPreview(index);
    itemEls[index]?.scrollIntoView({ block: "nearest" });
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirm(THEMES[focusIndex].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelMenu();
    }
  }

  $effect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  });

  // the navbar's backdrop-blur creates a containing block for `position:
  // fixed` descendants, which would confine the overlay to the navbar's
  // box instead of the viewport — portal it to <body> to escape that
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }
</script>

<svelte:window onkeydown={onKeydown} />

<button
  onclick={openMenu}
  class="inline-flex h-7 items-center gap-2 border border-border bg-bg-alt px-3 text-xs text-fg-muted transition hover:border-accent hover:text-fg"
>
  <span
    class="h-1.5 w-1.5 rounded-full"
    style="background-color: var(--color-accent)"
  ></span>
  <span class="font-mono text-[0.6rem]">{getThemeMeta().label}</span>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    class="h-3.5 w-3.5"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
  </svg>
</button>

{#if open}
  <div
    use:portal
    class="fixed inset-0 z-100 flex items-start justify-center bg-black/20 pt-24 backdrop-blur-[2px]"
  >
    <div
      class="w-full max-w-sm overflow-hidden border border-accent bg-bg-alt text-fg shadow-2xl"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="flex items-center gap-2 border-b border-border px-4 py-3">
        <span class="text-xs tracking-wide text-fg-muted uppercase"
          >settings</span
        >
        <span
          class="rounded-md bg-accent/15 px-2 py-1 text-xs font-medium text-accent"
          >theme</span
        >
      </div>

      <div class="max-h-[60vh] overflow-y-auto p-2">
        {#each groups as group (group.label)}
          <div class="flex items-center gap-2 px-2 pt-2 pb-1">
            <span class="text-[11px] tracking-wide text-fg-muted uppercase"
              >{group.label}</span
            >
            <span class="h-px flex-1 bg-border"></span>
          </div>
          {#each group.items as item (item.id)}
            {@const index = THEMES.findIndex((t) => t.id === item.id)}
            <button
              bind:this={itemEls[index]}
              onclick={() => confirm(item.id)}
              onmouseenter={() => focusAndPreview(index)}
              class="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition {focusIndex ===
              index
                ? 'bg-accent/15 text-fg'
                : 'text-fg-muted hover:bg-accent/10 hover:text-fg'}"
            >
              <span class="flex items-center gap-1.5">
                <span class="w-3 text-accent"
                  >{focusIndex === index ? "›" : ""}</span
                >
                {item.label}
              </span>
              {#if getThemeId() === item.id}
                <span class="text-accent">✓</span>
              {/if}
            </button>
          {/each}
        {/each}
      </div>

      <div
        class="flex items-center justify-between border-t border-border px-4 py-2"
      >
        <button
          onclick={cancelMenu}
          class="rounded-md border border-border px-2.5 py-1 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
        >
          Cancel
        </button>
        <span class="flex items-center gap-3 text-[11px] text-fg-muted">
          <span class="flex items-center gap-1">
            <kbd class="rounded border border-border bg-bg px-1">↑↓</kbd> select
          </span>
          <span class="flex items-center gap-1"
            ><kbd class="rounded border border-border bg-bg px-1">↵</kbd> apply</span
          >
          <span class="flex items-center gap-1"
            ><kbd class="rounded border border-border bg-bg px-1">esc</kbd> close</span
          >
        </span>
      </div>
    </div>
  </div>
{/if}
