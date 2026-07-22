// Used by the Toc scrollspy: a heading only counts as "active" once it has
// scrolled past this many px from the top of its scroll container.
export const TOC_ACTIVE_OFFSET = 96;

export function scrollToHeading(target: HTMLElement, behavior: ScrollBehavior = 'smooth') {
	const container = target.closest<HTMLElement>('.overflow-y-auto');
	if (!container) {
		target.scrollIntoView({ behavior, block: 'start' });
		return;
	}

	// Land the heading flush at the container's top edge - no offset gap.
	const top =
		target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
	container.scrollTo({ top, behavior });
}
