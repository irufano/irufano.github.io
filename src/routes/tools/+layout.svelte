<script lang="ts">
	import ToolsNavbar from '$lib/components/ToolsNavbar.svelte';
	import ToolsSidebar from '$lib/components/ToolsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	let mobileOpen = $state(false);
	let collapsed = $state(
		typeof localStorage === 'undefined' ? false : localStorage.getItem('tools-sidebar-collapsed') === 'true'
	);

	$effect(() => {
		localStorage.setItem('tools-sidebar-collapsed', String(collapsed));
	});
</script>

<div class="flex min-h-0 flex-1">
	<ToolsSidebar
		open={mobileOpen}
		{collapsed}
		onnavigate={() => (mobileOpen = false)}
		oncollapse={() => (collapsed = !collapsed)}
	/>
	<div class="flex min-h-0 flex-1 flex-col">
		<ToolsNavbar onmenu={() => (mobileOpen = !mobileOpen)} />
		<main class="min-w-0 flex-1 overflow-y-auto">
			{@render children()}
		</main>
		<Footer />
	</div>
</div>
