export type TreeFormat = 'ascii' | 'markdown';
export type TreeSortMode = 'none' | 'alpha' | 'dirs-first';

export const TREE_EXAMPLE = `+ root
    + parent
        + child
        	+ children
                + file.md
    + other
    	+ other child
        + other child
    + file.md
    + config.md`;

export const treeMdGeneratorState = $state({
	input: TREE_EXAMPLE,
	format: 'ascii' as TreeFormat,
	sortMode: 'none' as TreeSortMode,
	trailingSlash: true,
	wrapFence: true
});
