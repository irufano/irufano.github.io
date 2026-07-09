export type JsonIndent = '2' | '4' | 'tab' | 'min';

export const JSON_EXAMPLE = `{
  "name": "irufano",
  "role": "developer",
  "skills": ["svelte", "typescript", "tailwind"],
  "active": true,
  "profile": {
    "location": "Indonesia",
    "years": 5
  }
}`;

export const jsonFormatterState = $state({
	input: '',
	indent: '2' as JsonIndent
});
