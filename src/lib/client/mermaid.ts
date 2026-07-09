import { getThemeMeta } from '$lib/theme.svelte';

let renderCount = 0;

export async function renderMermaidBlocks(root: ParentNode): Promise<void> {
	const blocks = Array.from(root.querySelectorAll<HTMLElement>('.mermaid-block[data-mermaid]'));
	if (!blocks.length) return;

	const { default: mermaid } = await import('mermaid');
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: 'strict',
		theme: getThemeMeta().group === 'dark' ? 'dark' : 'default'
	});

	for (const block of blocks) {
		const source = block.dataset.mermaid;
		if (!source) continue;
		try {
			const { svg } = await mermaid.render(`mermaid-${Date.now()}-${renderCount++}`, source);
			block.innerHTML = svg;
			block.setAttribute('data-rendered', 'true');
		} catch {
			block.textContent = 'Failed to render diagram.';
		}
	}
}
