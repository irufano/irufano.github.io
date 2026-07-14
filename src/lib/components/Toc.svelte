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
			.map((item) => ({ id: item.id, el: document.getElementById(item.id) }))
			.filter((h): h is { id: string; el: HTMLElement } => !!h.el);
		if (!headingEls.length) return;

		// An IntersectionObserver only fires when isIntersecting *changes*, so a
		// heading whose enter and exit both happen between two observer ticks
		// (e.g. adjacent headings scrolled past quickly) never reports at all and
		// gets skipped. Instead, recompute directly from live positions: the
		// active item is the last heading (in document order) that has already
		// scrolled up to/past the offset line.
		const updateActive = () => {
			let current = headingEls[0].id;
			for (const { id, el } of headingEls) {
				if (el.getBoundingClientRect().top <= TOC_ACTIVE_OFFSET + 1) {
					current = id;
				} else {
					break;
				}
			}
			activeId = current;
		};

		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				updateActive();
				ticking = false;
			});
		};

		const container = headingEls[0].el.closest<HTMLElement>('.overflow-y-auto');
		const scrollTarget: HTMLElement | Window = container ?? window;

		updateActive();
		scrollTarget.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			scrollTarget.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	$effect(() => {
		if (!listEl || !activeId) return;
		const activeEl = listEl.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`);
		if (!activeEl) return;

		// Scroll listEl's own scrollTop directly rather than scrollIntoView:
		// listEl sits inside the same outer .overflow-y-auto section the article
		// scrolls within, so scrollIntoView's ancestor-walking would also nudge
		// that shared container and fight with scrollToHeading's animation there.
		const listRect = listEl.getBoundingClientRect();
		const elRect = activeEl.getBoundingClientRect();
		if (elRect.top < listRect.top) {
			listEl.scrollTop -= listRect.top - elRect.top;
		} else if (elRect.bottom > listRect.bottom) {
			listEl.scrollTop += elRect.bottom - listRect.bottom;
		}
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
						class="toc-link {item.depth === 3 ? 'depth-3' : ''} {item.depth === 4
							? 'depth-4'
							: ''} {activeId === item.id
							? 'active'
							: ''}"
					>
						{#if item.html}
							{@html item.html}
						{:else}
							{item.text}
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
