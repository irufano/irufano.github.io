<script lang="ts">
	import type { TocItem } from '$lib/server/markdown';
	import { TOC_ACTIVE_OFFSET, scrollToHeading } from '$lib/utils/scroll';

	let { items }: { items: TocItem[] } = $props();
	let activeId = $state<string | null>(null);
	let listEl: HTMLElement | undefined = $state();
	let isScrolling = $state(false);

	$effect(() => {
		if (!listEl) return;
		let timeout: ReturnType<typeof setTimeout>;
		const handleScroll = () => {
			isScrolling = true;
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				isScrolling = false;
			}, 600);
		};
		listEl.addEventListener('scroll', handleScroll);
		return () => {
			listEl?.removeEventListener('scroll', handleScroll);
			clearTimeout(timeout);
		};
	});

	$effect(() => {
		if (!items.length) return;
		const headingEls = items
			.map((item) => document.getElementById(item.id))
			.filter((el): el is HTMLElement => !!el);
		if (!headingEls.length) return;

		const intersecting = new Set<string>();
		const observer = new IntersectionObserver(
			(observed) => {
				for (const entry of observed) {
					if (entry.isIntersecting) {
						intersecting.add(entry.target.id);
					} else {
						intersecting.delete(entry.target.id);
					}
				}
				// entries arrive in whichever order the browser detected the change, not
				// document order, so pick the topmost intersecting heading ourselves
				const active = items.find((item) => intersecting.has(item.id));
				if (active) activeId = active.id;
			},
			{ rootMargin: `-${TOC_ACTIVE_OFFSET}px 0px -70% 0px`, threshold: 0 }
		);
		headingEls.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});

	function handleClick(event: MouseEvent, id: string) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		const target = document.getElementById(id);
		if (!target) return;

		event.preventDefault();
		history.pushState(null, '', `#${id}`);
		scrollToHeading(target, 'smooth');
		// activeId is left to the IntersectionObserver — it flips once the
		// heading actually arrives at the scrollspy threshold, not on click
	}
</script>

{#if items.length}
	<nav aria-label="Table of contents" class="flex min-h-0 flex-col text-sm">
		<p class="mb-2 shrink-0 font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted">
			On this page
		</p>
		<ul
			bind:this={listEl}
			class="toc-list min-h-0 overflow-y-auto {isScrolling ? 'is-scrolling' : ''}"
		>
			{#each items as item (item.id)}
				<li>
					<a
						href={`#${item.id}`}
						onclick={(event) => handleClick(event, item.id)}
						class="toc-link  {item.depth === 3 ? 'depth-3' : ''} {activeId === item.id
							? 'active'
							: ''}"
					>
						{item.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
