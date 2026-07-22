<script lang="ts">
  import LogoMark from "./LogoMark.svelte";
</script>

<footer class="border-t border-border">
  <div
    class="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-3 text-sm text-fg-muted sm:px-6"
  >
    <LogoMark size={12} />
    <p class="font-mono">
      irufano - {new Date().getFullYear()}
    </p>
    <!-- <a
      href="https://github.com"
      target="_blank"
      rel="noreferrer"
      class="hover:text-fg">GitHub</a
    > -->
  </div>
</footer>
