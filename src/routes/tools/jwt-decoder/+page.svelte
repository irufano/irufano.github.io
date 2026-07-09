<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'JWT Decoder — Tools — irufano';
	const description = "Decode a JWT's header and payload and inspect its claims.";
	const canonicalUrl = `${SITE_URL}/tools/jwt-decoder`;

	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Wand2 from 'lucide-svelte/icons/wand-2';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import { jwtDecoderState, JWT_EXAMPLE } from '$lib/state/jwt-decoder.svelte';

	let token = $state(jwtDecoderState.token);
	let copiedHeader = $state(false);
	let copiedPayload = $state(false);

	$effect(() => {
		jwtDecoderState.token = token;
	});

	function base64UrlDecode(segment: string): string {
		let normalized = segment.trim().replace(/-/g, '+').replace(/_/g, '/');
		const pad = normalized.length % 4;
		if (pad) normalized += '='.repeat(4 - pad);
		const binary = atob(normalized);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	}

	type Decoded = {
		ok: true;
		header: Record<string, unknown>;
		payload: Record<string, unknown>;
		signature: string;
	};
	type DecodeFailure = { ok: false; error: string };

	const decoded = $derived.by((): Decoded | DecodeFailure => {
		const trimmed = token.trim();
		if (!trimmed) return { ok: false, error: '' };

		const parts = trimmed.split('.');
		if (parts.length !== 3) {
			return { ok: false, error: 'A JWT has three dot-separated parts (header.payload.signature).' };
		}

		try {
			const header = JSON.parse(base64UrlDecode(parts[0]));
			const payload = JSON.parse(base64UrlDecode(parts[1]));
			return { ok: true, header, payload, signature: parts[2] };
		} catch {
			return { ok: false, error: "Could not decode this token — check that it's a valid JWT." };
		}
	});

	const headerJson = $derived(decoded.ok ? JSON.stringify(decoded.header, null, 2) : '');
	const payloadJson = $derived(decoded.ok ? JSON.stringify(decoded.payload, null, 2) : '');

	function formatDuration(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	}

	function describeClaim(label: string, value: unknown): { label: string; value: string; note?: string } | null {
		if (typeof value !== 'number') return null;
		const date = new Date(value * 1000);
		if (Number.isNaN(date.getTime())) return null;

		let note: string | undefined;
		if (label === 'exp') {
			const diff = date.getTime() - Date.now();
			note = diff > 0 ? `expires in ${formatDuration(diff)}` : `expired ${formatDuration(-diff)} ago`;
		} else if (label === 'nbf' && date.getTime() > Date.now()) {
			note = `not valid for ${formatDuration(date.getTime() - Date.now())}`;
		}

		return { label, value: date.toLocaleString(), note };
	}

	const claims = $derived.by(() => {
		if (!decoded.ok) return [];
		return (['iat', 'nbf', 'exp'] as const)
			.map((key) => describeClaim(key, decoded.payload[key]))
			.filter((c): c is { label: string; value: string; note?: string } => c !== null);
	});

	async function copyJson(kind: 'header' | 'payload') {
		const text = kind === 'header' ? headerJson : payloadJson;
		if (!text) return;
		await navigator.clipboard.writeText(text);
		if (kind === 'header') {
			copiedHeader = true;
			setTimeout(() => (copiedHeader = false), 1500);
		} else {
			copiedPayload = true;
			setTimeout(() => (copiedPayload = false), 1500);
		}
	}

	async function pasteToken() {
		try {
			token = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable — ignore
		}
	}

	function loadExample() {
		token = JWT_EXAMPLE;
	}

	function clearToken() {
		token = '';
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">JWT Decoder</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Paste a JWT to inspect its header, payload, and claims. This only decodes — it never verifies
		the signature.
	</p>

	<div class="mt-8">
		<div class="flex items-center justify-between gap-2">
			<label for="jwt-input" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				Token
			</label>
			<div class="flex items-center gap-1">
				<button
					onclick={loadExample}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<Wand2 class="h-3.5 w-3.5" />
					Example
				</button>
				<button
					onclick={pasteToken}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<Clipboard class="h-3.5 w-3.5" />
					Paste
				</button>
				<button
					onclick={clearToken}
					disabled={!token}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
				>
					<Trash2 class="h-3.5 w-3.5" />
					Clear
				</button>
			</div>
		</div>

		<textarea
			id="jwt-input"
			bind:value={token}
			placeholder="Paste a JWT here (header.payload.signature)..."
			rows="4"
			spellcheck="false"
			class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm break-all text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
		></textarea>

		{#if token.trim() && !decoded.ok}
			<p class="mt-2 flex items-start gap-1.5 text-xs text-red-400">
				<CircleX class="mt-0.5 h-3.5 w-3.5 shrink-0" />
				{decoded.error}
			</p>
		{/if}
	</div>

	{#if decoded.ok}
		<div class="mt-6 grid gap-6 lg:grid-cols-2">
			<div>
				<div class="flex items-center justify-between gap-2">
					<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Header</p>
					<button
						onclick={() => copyJson('header')}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						{#if copiedHeader}
							<Check class="h-3.5 w-3.5 text-accent" />
							Copied
						{:else}
							<Copy class="h-3.5 w-3.5" />
							Copy
						{/if}
					</button>
				</div>
				<textarea
					value={headerJson}
					readonly
					rows="8"
					spellcheck="false"
					class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg focus:border-accent focus:outline-none"
				></textarea>
			</div>

			<div>
				<div class="flex items-center justify-between gap-2">
					<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Payload</p>
					<button
						onclick={() => copyJson('payload')}
						class="flex cursor-pointer items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
					>
						{#if copiedPayload}
							<Check class="h-3.5 w-3.5 text-accent" />
							Copied
						{:else}
							<Copy class="h-3.5 w-3.5" />
							Copy
						{/if}
					</button>
				</div>
				<textarea
					value={payloadJson}
					readonly
					rows="8"
					spellcheck="false"
					class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg focus:border-accent focus:outline-none"
				></textarea>
			</div>
		</div>

		{#if claims.length}
			<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
				{#each claims as claim (claim.label)}
					<div class="rounded-none border border-border bg-bg-alt p-3">
						<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">{claim.label}</p>
						<p class="mt-1 text-sm text-fg">{claim.value}</p>
						{#if claim.note}
							<p class="mt-0.5 text-xs text-accent">{claim.note}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-6">
			<p class="font-mono text-xs uppercase tracking-wide text-fg-muted">Signature</p>
			<p class="mt-2 break-all rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg-muted">
				{decoded.signature}
			</p>
			<p class="mt-2 flex items-start gap-1.5 text-xs text-fg-muted">
				<ShieldCheck class="mt-0.5 h-3.5 w-3.5 shrink-0" />
				Not verified — this tool decodes the token but doesn't check the signature against a secret
				or public key.
			</p>
		</div>
	{/if}
</section>
