export const SITE_URL = 'https://irufano.github.io';
export const SITE_NAME = 'irufano';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path: string): string {
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
