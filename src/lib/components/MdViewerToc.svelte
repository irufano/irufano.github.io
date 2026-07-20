<script module lang="ts">
	export interface MdTocItem {
		id: string;
		text: string;
		html: string;
		depth: 2 | 3 | 4 | 5 | 6;
	}
</script>

<script lang="ts">
	import { scrollToHeading } from '$lib/utils/scroll';

	let { items, containerEl }: { items: MdTocItem[]; containerEl: HTMLElement | undefined } =
		$props();

	// How far (px) below the container's own top edge a heading must scroll
	// before it counts as "active". Unlike the blog post's Toc.svelte, this
	// container is a small scrollable box embedded mid-page rather than the
	// page's own scroll region, so the threshold is anchored to the
	// container's own bounding rect instead of a viewport-relative constant.
	const ACTIVE_OFFSET = 8;

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
		if (!items.length || !containerEl) return;
		const container = containerEl;
		const headingEls = items
			.map((item) => ({
				id: item.id,
				el: container.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`)
			}))
			.filter((h): h is { id: string; el: HTMLElement } => !!h.el);
		if (!headingEls.length) return;

		const updateActive = () => {
			const threshold = container.getBoundingClientRect().top + ACTIVE_OFFSET;
			let current = headingEls[0].id;
			for (const { id, el } of headingEls) {
				if (el.getBoundingClientRect().top <= threshold) {
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

		updateActive();
		container.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			container.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	$effect(() => {
		if (!listEl || !activeId) return;
		const activeEl = listEl.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`);
		if (!activeEl) return;

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
		const target = containerEl?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
		if (!target) return;

		event.preventDefault();
		scrollToHeading(target, 'smooth');
	}
</script>

{#if items.length}
	<nav aria-label="Table of contents" class="flex min-h-0 flex-col text-sm">
		<p class="mb-2 shrink-0 font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted">
			On this md
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
							: ''} {item.depth === 5 ? 'depth-5' : ''} {item.depth === 6
							? 'depth-6'
							: ''} {activeId === item.id ? 'active' : ''}"
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
