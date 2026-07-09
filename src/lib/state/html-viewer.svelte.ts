export type DeviceMode = 'full' | 'tablet' | 'mobile';
export type ViewMode = 'split' | 'code' | 'preview';

export const HTML_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>My Page</title>
	<style>
		body {
			margin: 0;
			font-family: system-ui, sans-serif;
			background: #0b0d10;
			color: #e6e6e6;
			display: grid;
			place-items: center;
			min-height: 100vh;
		}
		main {
			text-align: center;
			padding: 2rem;
		}
		h1 {
			font-size: 2rem;
			margin-bottom: 0.5rem;
		}
		p {
			color: #9aa0a6;
		}
		button {
			margin-top: 1.5rem;
			padding: 0.6rem 1.2rem;
			border: 1px solid #3a3f46;
			background: transparent;
			color: inherit;
			cursor: pointer;
			font-size: 0.9rem;
		}
		button:hover {
			border-color: #6ee7b7;
			color: #6ee7b7;
		}
	</style>
</head>
<body>
	<main>
		<h1>Hello, world!</h1>
		<p>Start editing to build your page.</p>
		<button onclick="alert('Hello!')">Click me</button>
	</main>
</body>
</html>
`;

export const htmlViewerState = $state({
	code: HTML_STARTER,
	viewMode: 'split' as ViewMode,
	deviceMode: 'full' as DeviceMode
});
