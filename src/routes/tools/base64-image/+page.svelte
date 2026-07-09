<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Base64 Image Converter — Tools — irufano';
	const description =
		'Convert an image to a Base64 data URI, or decode a Base64 string back into an image.';
	const canonicalUrl = `${SITE_URL}/tools/base64-image`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Upload from 'lucide-svelte/icons/upload';
	import Download from 'lucide-svelte/icons/download';
	import ImageOff from 'lucide-svelte/icons/image-off';
	import {
		base64ImageState,
		IMAGE_MIME_OPTIONS,
		type ImageMode,
		type ImageOutputFormat
	} from '$lib/state/base64-image.svelte';

	let mode = $state<ImageMode>(base64ImageState.mode);
	let outputFormat = $state<ImageOutputFormat>(base64ImageState.outputFormat);
	let decodeInput = $state(base64ImageState.decodeInput);
	let decodeMime = $state(base64ImageState.decodeMime);
	let copied = $state(false);

	$effect(() => {
		base64ImageState.mode = mode;
		base64ImageState.outputFormat = outputFormat;
		base64ImageState.decodeInput = decodeInput;
		base64ImageState.decodeMime = decodeMime;
	});

	function formatBytes(bytes: number): string {
		return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
	}

	// --- Encode ---
	let fileName = $state('');
	let fileType = $state('');
	let fileSize = $state(0);
	let dataUrl = $state('');
	let encWidth = $state(0);
	let encHeight = $state(0);
	let dragOver = $state(false);
	let fileInputEl = $state<HTMLInputElement>();

	function loadFile(file: File) {
		fileName = file.name;
		fileType = file.type || 'unknown';
		fileSize = file.size;

		const reader = new FileReader();
		reader.onload = () => {
			dataUrl = reader.result as string;
			const img = new Image();
			img.onload = () => {
				encWidth = img.naturalWidth;
				encHeight = img.naturalHeight;
			};
			img.src = dataUrl;
		};
		reader.readAsDataURL(file);
	}

	function onFileInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) loadFile(file);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('image/')) loadFile(file);
	}

	function clearEncode() {
		fileName = '';
		fileType = '';
		fileSize = 0;
		dataUrl = '';
		encWidth = 0;
		encHeight = 0;
		if (fileInputEl) fileInputEl.value = '';
	}

	const base64Only = $derived(dataUrl.split(',')[1] ?? '');

	const encodedOutput = $derived.by(() => {
		if (!dataUrl) return '';
		switch (outputFormat) {
			case 'raw':
				return base64Only;
			case 'css':
				return `background-image: url("${dataUrl}");`;
			case 'html':
				return `<img src="${dataUrl}" alt="${fileName}" />`;
			default:
				return dataUrl;
		}
	});

	const encodeStats = $derived([
		{ label: 'Type', value: fileType },
		{ label: 'Dimensions', value: encWidth ? `${encWidth}×${encHeight}` : '—' },
		{ label: 'Original', value: fileSize ? formatBytes(fileSize) : '—' },
		{ label: 'Encoded', value: base64Only ? formatBytes(base64Only.length) : '—' }
	]);

	async function copyEncoded() {
		if (!encodedOutput) return;
		await navigator.clipboard.writeText(encodedOutput);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	// --- Decode ---
	let decWidth = $state(0);
	let decHeight = $state(0);
	let decodeStatus = $state<'idle' | 'valid' | 'error'>('idle');

	const detectedMime = $derived.by(() => {
		const m = decodeInput.trim().match(/^data:([^;]+);base64,/i);
		return m ? m[1] : null;
	});

	const decodedDataUrl = $derived.by(() => {
		const trimmed = decodeInput.trim();
		if (!trimmed) return '';
		if (detectedMime) return trimmed;
		const cleaned = trimmed.replace(/\s+/g, '');
		if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) return '';
		return `data:${decodeMime};base64,${cleaned}`;
	});

	$effect(() => {
		if (!decodedDataUrl) {
			decodeStatus = 'idle';
			decWidth = 0;
			decHeight = 0;
		}
	});

	function handleDecodedLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		decWidth = img.naturalWidth;
		decHeight = img.naturalHeight;
		decodeStatus = 'valid';
	}

	function handleDecodedError() {
		decodeStatus = 'error';
		decWidth = 0;
		decHeight = 0;
	}

	const activeMime = $derived(detectedMime ?? decodeMime);
	const downloadExt = $derived(
		IMAGE_MIME_OPTIONS.find((m) => m.value === activeMime)?.ext ?? 'png'
	);

	const decodeStats = $derived([
		{ label: 'Type', value: decodeStatus === 'valid' ? activeMime : '—' },
		{ label: 'Dimensions', value: decodeStatus === 'valid' ? `${decWidth}×${decHeight}` : '—' },
		{
			label: 'Size',
			value: decodedDataUrl ? formatBytes((decodedDataUrl.split(',')[1] ?? '').length) : '—'
		}
	]);

	async function pasteDecodeInput() {
		try {
			decodeInput = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable — ignore
		}
	}

	function clearDecode() {
		decodeInput = '';
	}

	function downloadDecoded() {
		if (decodeStatus !== 'valid' || !decodedDataUrl) return;
		const a = document.createElement('a');
		a.href = decodedDataUrl;
		a.download = `image.${downloadExt}`;
		a.click();
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
</svelte:head>

<section class="w-full px-4 py-10 sm:px-6">
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Base64 Image Converter</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Encode an image to a Base64 data URI, or decode Base64 back into a downloadable image.
	</p>

	<div class="mt-6 inline-flex rounded-none border border-border">
		<button
			onclick={() => (mode = 'encode')}
			class={`cursor-pointer px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
				mode === 'encode' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
			}`}
		>
			Encode
		</button>
		<button
			onclick={() => (mode = 'decode')}
			class={`cursor-pointer border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
				mode === 'decode' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
			}`}
		>
			Decode
		</button>
	</div>

	{#if mode === 'encode'}
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-xl">
			{#each encodeStats as stat (stat.label)}
				<div class="rounded-none border border-border bg-bg-alt p-3">
					<p class="truncate font-mono text-sm font-bold text-accent sm:text-base">{stat.value}</p>
					<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
				</div>
			{/each}
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<div>
				<div class="flex items-center justify-between gap-2">
					<p class="mt-2 mb-2 font-mono text-xs uppercase tracking-wide text-fg-muted">Image</p>
					{#if fileName}
						<button
							onclick={clearEncode}
							class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg"
						>
							<Trash2 class="h-3.5 w-3.5" />
							Clear
						</button>
					{/if}
				</div>

				<button
					type="button"
					onclick={() => fileInputEl?.click()}
					ondragover={(e) => {
						e.preventDefault();
						dragOver = true;
					}}
					ondragleave={() => (dragOver = false)}
					ondrop={onDrop}
					class={`mt-2 flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-4 transition ${
						dragOver ? 'border-accent bg-accent/5' : 'border-border bg-bg-alt hover:border-accent/50'
					}`}
				>
					{#if dataUrl}
						<img src={dataUrl} alt={fileName} class="max-h-full max-w-full object-contain" />
					{:else}
						<Upload class="h-6 w-6 text-fg-muted" />
						<p class="text-sm text-fg-muted">Drop an image here or click to browse</p>
					{/if}
				</button>

				<input
					bind:this={fileInputEl}
					onchange={onFileInputChange}
					type="file"
					accept="image/*"
					class="hidden"
				/>
			</div>

			<div>
				<div class="flex flex-wrap items-center justify-between gap-2">
					<label for="image-output" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
						Output
					</label>
					<div class="flex items-center gap-2">
						<div class="inline-flex rounded-none border border-border">
							<button
								onclick={() => (outputFormat = 'datauri')}
								class={`cursor-pointer px-2.5 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
									outputFormat === 'datauri' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
								}`}
							>
								Data URI
							</button>
							<button
								onclick={() => (outputFormat = 'raw')}
								class={`cursor-pointer border-l border-border px-2.5 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
									outputFormat === 'raw' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
								}`}
							>
								Base64
							</button>
							<button
								onclick={() => (outputFormat = 'css')}
								class={`cursor-pointer border-l border-border px-2.5 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
									outputFormat === 'css' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
								}`}
							>
								CSS
							</button>
							<button
								onclick={() => (outputFormat = 'html')}
								class={`cursor-pointer border-l border-border px-2.5 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
									outputFormat === 'html' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
								}`}
							>
								HTML
							</button>
						</div>
						<button
							onclick={copyEncoded}
							disabled={!encodedOutput}
							class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
						>
							{#if copied}
								<Check class="h-3.5 w-3.5 text-accent" />
								Copied
							{:else}
								<Copy class="h-3.5 w-3.5" />
								Copy
							{/if}
						</button>
					</div>
				</div>

				<textarea
					id="image-output"
					value={encodedOutput}
					readonly
					placeholder="Base64 output will appear here..."
					spellcheck="false"
					class="mt-2 h-64 w-full resize-none rounded-none border border-border bg-bg-alt p-4 font-mono text-sm break-all text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
				></textarea>
			</div>
		</div>
	{:else}
		<div class="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
			{#each decodeStats as stat (stat.label)}
				<div class="rounded-none border border-border bg-bg-alt p-3">
					<p class="truncate font-mono text-sm font-bold text-accent sm:text-base">{stat.value}</p>
					<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
				</div>
			{/each}
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<div>
				<div class="flex items-center justify-between gap-2">
					<label for="image-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
						Base64 (with or without the data: prefix)
					</label>
					<div class="flex items-center gap-1">
						<button
							onclick={pasteDecodeInput}
							class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
						>
							<Clipboard class="h-3.5 w-3.5" />
							Paste
						</button>
						<button
							onclick={clearDecode}
							disabled={!decodeInput}
							class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
						>
							<Trash2 class="h-3.5 w-3.5" />
							Clear
						</button>
					</div>
				</div>

				<textarea
					id="image-input"
					bind:value={decodeInput}
					placeholder="Paste a data URI or raw Base64 string..."
					spellcheck="false"
					class="mt-2 h-64 w-full resize-none rounded-none border border-border bg-bg-alt p-4 font-mono text-sm break-all text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
				></textarea>

				{#if !detectedMime}
					<div class="mt-3 flex items-center gap-2">
						<label for="image-mime" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
							Format
						</label>
						<div class="relative">
							<select
								id="image-mime"
								bind:value={decodeMime}
								class="cursor-pointer appearance-none rounded-none border border-border bg-bg-alt py-1.5 pl-2 pr-7 text-xs text-fg focus:border-accent focus:outline-none"
							>
								{#each IMAGE_MIME_OPTIONS as opt (opt.value)}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
						<p class="text-xs text-fg-muted">No data: prefix detected — pick the image format.</p>
					</div>
				{/if}

				{#if decodeInput && decodeStatus === 'error'}
					<p class="mt-2 flex items-start gap-1.5 text-xs text-red-400">
						<ImageOff class="mt-0.5 h-3.5 w-3.5 shrink-0" />
						Couldn't render this as an image — check the Base64 data.
					</p>
				{/if}
			</div>

			<div>
				<div class="flex items-center justify-between gap-2">
					<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Preview</p>
					<button
						onclick={downloadDecoded}
						disabled={decodeStatus !== 'valid'}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
					>
						<Download class="h-3.5 w-3.5" />
						Download
					</button>
				</div>

				<div class="mt-2 flex h-64 w-full items-center justify-center border border-border bg-bg-alt p-4">
					{#if decodedDataUrl}
						<img
							src={decodedDataUrl}
							alt="Decoded"
							onload={handleDecodedLoad}
							onerror={handleDecodedError}
							class="max-h-full max-w-full object-contain"
						/>
					{:else}
						<p class="text-sm text-fg-muted">Preview will appear here...</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</section>
