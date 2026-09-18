export type JsonStringMode = 'unescape' | 'escape';
export type JsonIndent = '2' | '4' | 'tab' | 'min';

export const JSON_STRING_ESCAPE_EXAMPLE =
	'"{\\"name\\":\\"irufano\\",\\"role\\":\\"developer\\",\\"skills\\":[\\"svelte\\",\\"typescript\\"]}"';

export const jsonStringEscapeState = $state({
	input: '',
	mode: 'unescape' as JsonStringMode,
	indent: '2' as JsonIndent
});
