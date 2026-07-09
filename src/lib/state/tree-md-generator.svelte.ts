export type TreeFormat = 'ascii' | 'markdown';
export type TreeSortMode = 'none' | 'alpha' | 'dirs-first';

export const TREE_EXAMPLE = `+ parent
    + child
    	+ children
+ other
	+ other child`;

export const treeMdGeneratorState = $state({
	input: TREE_EXAMPLE,
	format: 'ascii' as TreeFormat,
	sortMode: 'none' as TreeSortMode,
	trailingSlash: true,
	wrapFence: true
});
