<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'Color Converter — Tools — irufano';
	const description =
		'Convert colors between HEX, RGB, and HSL, with a live preview and contrast ratio.';
	const canonicalUrl = `${SITE_URL}/tools/color-converter`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Shuffle from 'lucide-svelte/icons/shuffle';
	import {
		hexToRgb,
		rgbToHex,
		rgbToHsl,
		hslToRgb,
		parseRgbString,
		parseHslString,
		relativeLuminance,
		contrastRatio,
		type Rgb,
		type Hsl
	} from '$lib/utils/color';
	import { colorConverterState } from '$lib/state/color-converter.svelte';

	let r = $state(colorConverterState.r);
	let g = $state(colorConverterState.g);
	let b = $state(colorConverterState.b);

	function formatHsl({ h, s, l }: Hsl): string {
		return `hsl(${h}, ${s}%, ${l}%)`;
	}

	function formatRgb({ r, g, b }: Rgb): string {
		return `rgb(${r}, ${g}, ${b})`;
	}

	const initialRgb = { r: colorConverterState.r, g: colorConverterState.g, b: colorConverterState.b };
	let hexText = $state(rgbToHex(initialRgb));
	let rgbText = $state(formatRgb(initialRgb));
	let hslText = $state(formatHsl(rgbToHsl(initialRgb)));
	let copiedField = $state('');

	$effect(() => {
		colorConverterState.r = r;
		colorConverterState.g = g;
		colorConverterState.b = b;
	});

	function setColor(next: Rgb, skip?: 'hex' | 'rgb' | 'hsl') {
		r = next.r;
		g = next.g;
		b = next.b;
		if (skip !== 'hex') hexText = rgbToHex(next);
		if (skip !== 'rgb') rgbText = formatRgb(next);
		if (skip !== 'hsl') hslText = formatHsl(rgbToHsl(next));
	}

	function handleHexInput(value: string) {
		hexText = value;
		const parsed = hexToRgb(value);
		if (parsed) setColor(parsed, 'hex');
	}

	function handleRgbInput(value: string) {
		rgbText = value;
		const parsed = parseRgbString(value);
		if (parsed) setColor(parsed, 'rgb');
	}

	function handleHslInput(value: string) {
		hslText = value;
		const parsed = parseHslString(value);
		if (parsed) setColor(hslToRgb(parsed), 'hsl');
	}

	function handlePicker(value: string) {
		const parsed = hexToRgb(value);
		if (parsed) setColor(parsed);
	}

	function randomColor() {
		setColor({
			r: Math.floor(Math.random() * 256),
			g: Math.floor(Math.random() * 256),
			b: Math.floor(Math.random() * 256)
		});
	}

	const hexValid = $derived(hexToRgb(hexText) !== null);
	const rgbValid = $derived(parseRgbString(rgbText) !== null);
	const hslValid = $derived(parseHslString(hslText) !== null);

	const contrast = $derived.by(() => {
		const lum = relativeLuminance({ r, g, b });
		const white = contrastRatio(lum, 1);
		const black = contrastRatio(lum, 0);
		return { white: white.toFixed(2), black: black.toFixed(2) };
	});

	const summaryStats = $derived([
		{ label: 'Contrast on white', value: `${contrast.white}:1` },
		{ label: 'Contrast on black', value: `${contrast.black}:1` }
	]);

	async function copyField(field: 'hex' | 'rgb' | 'hsl') {
		const text = field === 'hex' ? hexText : field === 'rgb' ? rgbText : hslText;
		await navigator.clipboard.writeText(text);
		copiedField = field;
		setTimeout(() => (copiedField = ''), 1500);
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">Color Converter</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Convert between HEX, RGB, and HSL — edit any field and the others update instantly.
	</p>

	<div class="mt-8 grid grid-cols-2 gap-3 sm:max-w-xs">
		{#each summaryStats as stat (stat.label)}
			<div class="rounded-none border border-border bg-bg-alt p-3">
				<p class="font-mono text-lg font-bold text-accent sm:text-xl">{stat.value}</p>
				<p class="mt-1 text-xs text-fg-muted">{stat.label}</p>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex flex-col gap-6 sm:flex-row">
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-32 w-32 shrink-0 border border-border sm:h-40 sm:w-40"
				style={`background-color: ${formatRgb({ r, g, b })}`}
			></div>
			<div class="flex items-center gap-2">
				<input
					type="color"
					value={rgbToHex({ r, g, b })}
					oninput={(e) => handlePicker(e.currentTarget.value)}
					class="h-9 w-9 cursor-pointer border border-border bg-transparent p-0"
				/>
				<button
					onclick={randomColor}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<Shuffle class="h-3.5 w-3.5" />
					Random
				</button>
			</div>
		</div>

		<div class="flex-1 space-y-4">
			<div>
				<label for="hex-field" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					HEX
				</label>
				<div class="mt-2 flex items-stretch gap-1">
					<input
						id="hex-field"
						value={hexText}
						oninput={(e) => handleHexInput(e.currentTarget.value)}
						spellcheck="false"
						class={`w-full rounded-none border bg-bg-alt px-3 py-2.5 font-mono text-sm text-fg focus:outline-none ${
							hexValid ? 'border-border focus:border-accent' : 'border-red-400/60'
						}`}
					/>
					<button
						onclick={() => copyField('hex')}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						{#if copiedField === 'hex'}
							<Check class="h-3.5 w-3.5 text-accent" />
						{:else}
							<Copy class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>
			</div>

			<div>
				<label for="rgb-field" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					RGB
				</label>
				<div class="mt-2 flex items-stretch gap-1">
					<input
						id="rgb-field"
						value={rgbText}
						oninput={(e) => handleRgbInput(e.currentTarget.value)}
						spellcheck="false"
						class={`w-full rounded-none border bg-bg-alt px-3 py-2.5 font-mono text-sm text-fg focus:outline-none ${
							rgbValid ? 'border-border focus:border-accent' : 'border-red-400/60'
						}`}
					/>
					<button
						onclick={() => copyField('rgb')}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						{#if copiedField === 'rgb'}
							<Check class="h-3.5 w-3.5 text-accent" />
						{:else}
							<Copy class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>
			</div>

			<div>
				<label for="hsl-field" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
					HSL
				</label>
				<div class="mt-2 flex items-stretch gap-1">
					<input
						id="hsl-field"
						value={hslText}
						oninput={(e) => handleHslInput(e.currentTarget.value)}
						spellcheck="false"
						class={`w-full rounded-none border bg-bg-alt px-3 py-2.5 font-mono text-sm text-fg focus:outline-none ${
							hslValid ? 'border-border focus:border-accent' : 'border-red-400/60'
						}`}
					/>
					<button
						onclick={() => copyField('hsl')}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						{#if copiedField === 'hsl'}
							<Check class="h-3.5 w-3.5 text-accent" />
						{:else}
							<Copy class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
</section>
