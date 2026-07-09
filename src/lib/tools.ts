import CaseSensitive from 'lucide-svelte/icons/case-sensitive';
import Lock from 'lucide-svelte/icons/lock';
import FolderTree from 'lucide-svelte/icons/folder-tree';
import Dices from 'lucide-svelte/icons/dices';
import CodeXml from 'lucide-svelte/icons/code-xml';
import PenLine from 'lucide-svelte/icons/pen-line';
import Braces from 'lucide-svelte/icons/braces';
import Binary from 'lucide-svelte/icons/binary';
import KeyRound from 'lucide-svelte/icons/key-round';
import RegexIcon from 'lucide-svelte/icons/regex';
import Hash from 'lucide-svelte/icons/hash';
import Palette from 'lucide-svelte/icons/palette';
import Image from 'lucide-svelte/icons/image';
import Table from 'lucide-svelte/icons/table';
import type { ComponentType, SvelteComponent } from 'svelte';

export const TOOL_CATEGORIES = ['Text', 'Code & Data', 'Encoding & Security', 'Design & Random'] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export type Tool = {
	slug: string;
	label: string;
	description: string;
	icon: ComponentType<SvelteComponent>;
	category: ToolCategory;
};

export const TOOLS: Tool[] = [
	{
		slug: 'character-counter',
		label: 'Character Counter',
		description: 'Count characters, words, and lines in your text.',
		icon: CaseSensitive,
		category: 'Text'
	},
	{
		slug: 'regex-tester',
		label: 'Regex Tester',
		description: 'Test a regular expression against a string and see matches highlighted.',
		icon: RegexIcon,
		category: 'Text'
	},
	{
		slug: 'tree-md-generator',
		label: 'Tree MD Generator',
		description: 'Generate a markdown directory tree from a file list.',
		icon: FolderTree,
		category: 'Text'
	},
	{
		slug: 'table-md-generator',
		label: 'Table MD Generator',
		description: 'Turn CSV, TSV, or delimited data into a clean Markdown table.',
		icon: Table,
		category: 'Text'
	},
	{
		slug: 'json-formatter',
		label: 'JSON Formatter',
		description: 'Format, validate, and minify JSON with instant error feedback.',
		icon: Braces,
		category: 'Code & Data'
	},
	{
		slug: 'html-viewer',
		label: 'HTML Viewer',
		description: 'Write or paste HTML and see a live preview, or build a page from scratch.',
		icon: CodeXml,
		category: 'Code & Data'
	},
	{
		slug: 'rich-text-editor',
		label: 'Rich Text Editor',
		description: 'Format text visually with a WYSIWYG editor and copy the generated HTML.',
		icon: PenLine,
		category: 'Code & Data'
	},
	{
		slug: 'aes-encryption',
		label: 'AES Encryption',
		description: 'Encrypt and decrypt text with AES.',
		icon: Lock,
		category: 'Encoding & Security'
	},
	{
		slug: 'base64',
		label: 'Base64 Encoder',
		description: 'Encode text to Base64 or decode Base64 back to text.',
		icon: Binary,
		category: 'Encoding & Security'
	},
	{
		slug: 'base64-image',
		label: 'Base64 Image Encoder',
		description: 'Convert an image to a Base64 data URI, or decode Base64 back into an image.',
		icon: Image,
		category: 'Encoding & Security'
	},
	{
		slug: 'jwt-decoder',
		label: 'JWT Decoder',
		description: "Decode a JWT's header and payload and inspect its claims.",
		icon: KeyRound,
		category: 'Encoding & Security'
	},
	{
		slug: 'hash-generator',
		label: 'Hash Generator',
		description: 'Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text.',
		icon: Hash,
		category: 'Encoding & Security'
	},
	{
		slug: 'color-converter',
		label: 'Color Converter',
		description: 'Convert colors between HEX, RGB, and HSL, with a live preview and contrast ratio.',
		icon: Palette,
		category: 'Design & Random'
	},
	{
		slug: 'random-picker',
		label: 'Random Picker',
		description: 'Pick a random winner from a list, with a spinning reveal and pick history.',
		icon: Dices,
		category: 'Design & Random'
	}
];

export function groupToolsByCategory(tools: Tool[]): { category: ToolCategory; tools: Tool[] }[] {
	return TOOL_CATEGORIES.map((category) => ({
		category,
		tools: tools.filter((tool) => tool.category === category)
	})).filter((group) => group.tools.length > 0);
}
