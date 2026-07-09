import type { TableAlignment } from '$lib/state/table-md-generator.svelte';

const DELIMITER_CANDIDATES = ['\t', ',', ';', '|'];

export function detectDelimiter(text: string): string {
	const firstLine = text.split('\n')[0] ?? '';
	let best = ',';
	let bestCount = -1;
	for (const candidate of DELIMITER_CANDIDATES) {
		const count = firstLine.split(candidate).length - 1;
		if (count > bestCount) {
			bestCount = count;
			best = candidate;
		}
	}
	return best;
}

export function parseDelimited(text: string, delimiter: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	const s = text.replace(/\r\n/g, '\n');

	for (let i = 0; i < s.length; i++) {
		const char = s[i];
		if (inQuotes) {
			if (char === '"') {
				if (s[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === delimiter) {
			row.push(field);
			field = '';
		} else if (char === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function escapeCell(cell: string): string {
	return cell.trim().replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function buildSeparatorCell(align: TableAlignment, width: number): string {
	const w = Math.max(3, width);
	if (align === 'center') return `:${'-'.repeat(Math.max(1, w - 2))}:`;
	if (align === 'left') return `:${'-'.repeat(Math.max(1, w - 1))}`;
	if (align === 'right') return `${'-'.repeat(Math.max(1, w - 1))}:`;
	return '-'.repeat(w);
}

export function buildMarkdownTable(
	rows: string[][],
	hasHeader: boolean,
	align: TableAlignment,
	pretty: boolean
): string {
	if (!rows.length) return '';

	const colCount = Math.max(...rows.map((r) => r.length));
	const normalized = rows.map((r) => {
		const cells = [...r];
		while (cells.length < colCount) cells.push('');
		return cells.map(escapeCell);
	});

	const header = hasHeader ? normalized[0] : normalized[0].map((_, i) => `Column ${i + 1}`);
	const bodyRows = hasHeader ? normalized.slice(1) : normalized;

	const widths = pretty
		? Array.from({ length: colCount }, (_, i) =>
				Math.max(header[i]?.length ?? 3, ...bodyRows.map((r) => r[i]?.length ?? 0), 3)
			)
		: Array.from({ length: colCount }, () => 0);

	const padCell = (cell: string, i: number) => (pretty ? cell.padEnd(widths[i]) : cell);

	const headerLine = `| ${header.map((c, i) => padCell(c, i)).join(' | ')} |`;
	const sepLine = `| ${Array.from({ length: colCount }, (_, i) =>
		buildSeparatorCell(align, pretty ? widths[i] : 3)
	).join(' | ')} |`;
	const bodyLines = bodyRows.map((r) => `| ${r.map((c, i) => padCell(c, i)).join(' | ')} |`);

	return [headerLine, sepLine, ...bodyLines].join('\n');
}
