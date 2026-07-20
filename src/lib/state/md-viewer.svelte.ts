export type ViewMode = 'split' | 'code' | 'preview';

export const MD_EXAMPLE = `# Markdown Viewer

Write or paste **Markdown** and see it rendered live, exactly like a blog post on this site.

## Features

This tool supports GitHub-flavored markdown: tables, task lists, and strikethrough.

- [x] Live preview
- [x] Table of contents
- [ ] Dark mode toggle

### Syntax Highlighting

Fenced code blocks are highlighted with Shiki and come with a one-click copy button.

\`\`\`js
function greet(name) {
	console.log(\`Hello, \${name}!\`);
}
\`\`\`

### Math

Math is rendered with KaTeX: inline $E = mc^2$ and display.

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

### Callouts

> [!TIP]
> This is a tip callout.

## Diagrams

### Flowchart

\`\`\`mermaid
graph TD
	A[Start] --> B{Is it working?}
	B -->|Yes| C[Ship it]
	B -->|No| A
\`\`\`

## Tables

| Tool | Language |
| --- | --- |
| Markdown Viewer | Markdown |
| JSON Formatter | JSON |
`;

export const mdViewerState = $state({
	code: MD_EXAMPLE,
	viewMode: 'split' as ViewMode
});
