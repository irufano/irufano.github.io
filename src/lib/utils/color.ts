export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

function clamp(n: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string): Rgb | null {
	const clean = hex.trim().replace(/^#/, '');
	const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}

export function rgbToHex({ r, g, b }: Rgb): string {
	return (
		'#' +
		[r, g, b]
			.map((n) =>
				clamp(Math.round(n), 0, 255)
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}

export function parseRgbString(input: string): Rgb | null {
	const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i);
	if (!m) return null;
	const rgb = { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
	if ([rgb.r, rgb.g, rgb.b].some((n) => n < 0 || n > 255)) return null;
	return rgb;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case rn:
				h = (gn - bn) / d + (gn < bn ? 6 : 0);
				break;
			case gn:
				h = (bn - rn) / d + 2;
				break;
			default:
				h = (rn - gn) / d + 4;
		}
		h /= 6;
	}

	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
	const hn = (((h % 360) + 360) % 360) / 360;
	const sn = clamp(s, 0, 100) / 100;
	const ln = clamp(l, 0, 100) / 100;

	if (sn === 0) {
		const v = Math.round(ln * 255);
		return { r: v, g: v, b: v };
	}

	const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
	const p = 2 * ln - q;

	const hue2rgb = (t: number): number => {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};

	return {
		r: Math.round(hue2rgb(hn + 1 / 3) * 255),
		g: Math.round(hue2rgb(hn) * 255),
		b: Math.round(hue2rgb(hn - 1 / 3) * 255)
	};
}

export function parseHslString(input: string): Hsl | null {
	const m = input.match(/hsla?\(\s*(-?\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)/i);
	if (!m) return null;
	return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

export function relativeLuminance({ r, g, b }: Rgb): number {
	const toLinear = (c: number): number => {
		const cs = c / 255;
		return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(l1: number, l2: number): number {
	const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (lighter + 0.05) / (darker + 0.05);
}
