<script lang="ts">
  import PixelBackground from "./PixelBackground.svelte";

  const links = [
    {
      label: "Posts",
      description: "Developer notes and docs",
      href: "/posts",
    },
    {
      label: "Tools",
      description: "Tools and utilities",
      href: "/tools",
    },
  ];
</script>

<section
  class="relative flex w-full flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-4 sm:px-6"
>
  <PixelBackground />

  <div class="relative z-10 mx-auto max-w-3xl text-center">
    <span
      class="inline-flex items-center gap-2 rounded-none border border-border px-3 py-1 text-xs text-fg-muted"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
      The Developer's Knowledge Hub
    </span>

    <h1
      class="mt-4 text-3xl font-extrabold font-mono tracking-tight text-fg sm:text-5xl md:text-6xl"
    >
      Refine Ideas,<br />Solidify 
      <span class="text-accent">Knowledge</span>.
    </h1>

    <p class="mx-auto mt-4 max-w-xl text-sm text-fg-muted sm:text-lg">
      The developer's second brain. A centralized system for organizing findings and converting technical notes into actionable assets.
    </p>
  </div>

  <div
    class="relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-none border border-border bg-bg-alt shadow-sm"
  >
    <div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
      <span class="h-2.5 w-2.5 rounded-full bg-fg-muted/30"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-fg-muted/30"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-fg-muted/30"></span>
    </div>
    <div class="divide-y divide-border">
      {#each links as link}
        <a
          href={link.href}
          class="group flex items-center justify-between gap-4 px-4 py-3 font-mono transition hover:bg-bg"
        >
          <span class="flex flex-col gap-0.5 text-left">
            <span class="text-sm text-fg">
              <span class="select-none text-accent">$</span> cd {link.href}
            </span>
            <span class="text-xs text-fg-muted"># {link.description}</span>
          </span>
          <span
            class="shrink-0 text-fg-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
            >&rarr;</span
          >
        </a>
      {/each}
    </div>
  </div>
</section>
