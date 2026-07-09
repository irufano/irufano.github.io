// Web Crypto has no MD5 digest, so this implements RFC 1321 directly.
// K[i] is derived from the sine formula in the RFC rather than hardcoded,
// to avoid a 64-entry magic-number table that's easy to mistype.

const S = [
	7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
	20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10,
	15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
	K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
}

function leftRotate(x: number, c: number): number {
	return ((x << c) | (x >>> (32 - c))) >>> 0;
}

function toLittleEndianHex(n: number): string {
	const bytes = [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
	return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function md5(message: string): string {
	const bytes = new TextEncoder().encode(message);
	const origLenBits = BigInt(bytes.length) * 8n;

	const withOne = new Uint8Array(bytes.length + 1);
	withOne.set(bytes);
	withOne[bytes.length] = 0x80;

	let totalLen = withOne.length;
	while (totalLen % 64 !== 56) totalLen++;

	const padded = new Uint8Array(totalLen + 8);
	padded.set(withOne);
	for (let i = 0; i < 8; i++) {
		padded[totalLen + i] = Number((origLenBits >> BigInt(8 * i)) & 0xffn);
	}

	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	const view = new DataView(padded.buffer);

	for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(chunkStart + j * 4, true);
		}

		let a = a0;
		let b = b0;
		let c = c0;
		let d = d0;

		for (let i = 0; i < 64; i++) {
			let f: number;
			let g: number;
			if (i < 16) {
				f = (b & c) | (~b & d);
				g = i;
			} else if (i < 32) {
				f = (d & b) | (~d & c);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				f = b ^ c ^ d;
				g = (3 * i + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * i) % 16;
			}

			f = (f + a + K[i] + M[g]) >>> 0;
			a = d;
			d = c;
			c = b;
			b = (b + leftRotate(f, S[i])) >>> 0;
		}

		a0 = (a0 + a) >>> 0;
		b0 = (b0 + b) >>> 0;
		c0 = (c0 + c) >>> 0;
		d0 = (d0 + d) >>> 0;
	}

	return [a0, b0, c0, d0].map(toLittleEndianHex).join('');
}
