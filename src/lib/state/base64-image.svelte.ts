export type ImageMode = 'encode' | 'decode';
export type ImageOutputFormat = 'datauri' | 'raw' | 'css' | 'html';

export const IMAGE_MIME_OPTIONS = [
	{ value: 'image/png', label: 'PNG', ext: 'png' },
	{ value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
	{ value: 'image/gif', label: 'GIF', ext: 'gif' },
	{ value: 'image/webp', label: 'WebP', ext: 'webp' },
	{ value: 'image/svg+xml', label: 'SVG', ext: 'svg' }
];

export const base64ImageState = $state({
	mode: 'encode' as ImageMode,
	outputFormat: 'datauri' as ImageOutputFormat,
	decodeInput: '',
	decodeMime: 'image/png'
});
