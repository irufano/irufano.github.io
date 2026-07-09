export type TableDelimiter = 'auto' | ',' | '\t' | ';' | '|';
export type TableAlignment = 'none' | 'left' | 'center' | 'right';

export const TABLE_EXAMPLE = `Name,Role,Location
Irufano,Developer,Indonesia
Jane Doe,Designer,USA
John Smith,PM,UK`;

export const tableMdGeneratorState = $state({
	input: TABLE_EXAMPLE,
	delimiter: 'auto' as TableDelimiter,
	hasHeader: true,
	alignment: 'none' as TableAlignment,
	pretty: true
});
