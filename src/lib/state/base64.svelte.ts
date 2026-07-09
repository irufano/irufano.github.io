export type Base64Mode = 'encode' | 'decode';

export const base64State = $state({
	input: '',
	mode: 'encode' as Base64Mode,
	urlSafe: false
});
