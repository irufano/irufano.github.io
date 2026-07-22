<script lang="ts">
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = 'AES Encryption - Tools - irufano';
	const description =
		'Encrypt and decrypt text with AES-GCM using a passphrase, right in your browser.';
	const canonicalUrl = `${SITE_URL}/tools/aes-encryption`;

	import Lock from 'lucide-svelte/icons/lock';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';
	import {
		aesEncryptionState,
		type AesMode,
		type AesKeySize
	} from '$lib/state/aes-encryption.svelte';

	type Mode = AesMode;
	type KeySize = AesKeySize;

	let mode = $state<Mode>(aesEncryptionState.mode);
	let keySize = $state<KeySize>(aesEncryptionState.keySize);
	let iterations = $state(aesEncryptionState.iterations);

	let inputText = $state(aesEncryptionState.inputText);
	let passphrase = $state('');
	let outputText = $state(aesEncryptionState.outputText);
	let showPassphrase = $state(false);
	let copied = $state(false);
	let error = $state('');
	let processing = $state(false);

	$effect(() => {
		aesEncryptionState.mode = mode;
		aesEncryptionState.keySize = keySize;
		aesEncryptionState.iterations = iterations;
		aesEncryptionState.inputText = inputText;
		aesEncryptionState.outputText = outputText;
	});

	const PBKDF2_SALT_BYTES = 16;
	const GCM_IV_BYTES = 12;

	const canSubmit = $derived(inputText.trim().length > 0 && passphrase.length > 0 && !processing);

	function bytesToBase64(bytes: Uint8Array): string {
		let binary = '';
		for (const byte of bytes) binary += String.fromCharCode(byte);
		return btoa(binary);
	}

	function base64ToBytes(base64: string): Uint8Array {
		const binary = atob(base64.trim());
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return bytes;
	}

	async function deriveKey(pass: string, salt: Uint8Array, bits: KeySize): Promise<CryptoKey> {
		const baseKey = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(pass),
			'PBKDF2',
			false,
			['deriveKey']
		);
		return crypto.subtle.deriveKey(
			{ name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
			baseKey,
			{ name: 'AES-GCM', length: bits },
			false,
			['encrypt', 'decrypt']
		);
	}

	async function encrypt() {
		const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
		const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
		const key = await deriveKey(passphrase, salt, keySize);

		const ciphertext = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: iv as BufferSource },
			key,
			new TextEncoder().encode(inputText)
		);

		const payload = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
		payload.set(salt, 0);
		payload.set(iv, salt.length);
		payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

		outputText = bytesToBase64(payload);
	}

	async function decrypt() {
		let payload: Uint8Array;
		try {
			payload = base64ToBytes(inputText);
		} catch {
			throw new Error('Ciphertext is not valid base64.');
		}

		if (payload.length < PBKDF2_SALT_BYTES + GCM_IV_BYTES + 1) {
			throw new Error('Ciphertext is too short to be valid.');
		}

		const salt = payload.slice(0, PBKDF2_SALT_BYTES);
		const iv = payload.slice(PBKDF2_SALT_BYTES, PBKDF2_SALT_BYTES + GCM_IV_BYTES);
		const data = payload.slice(PBKDF2_SALT_BYTES + GCM_IV_BYTES);

		const key = await deriveKey(passphrase, salt, keySize);

		try {
			const plaintext = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: iv as BufferSource },
				key,
				data as BufferSource
			);
			outputText = new TextDecoder().decode(plaintext);
		} catch {
			throw new Error('Decryption failed. Wrong passphrase, key size, or corrupted ciphertext.');
		}
	}

	async function run() {
		error = '';
		outputText = '';
		if (!canSubmit) return;

		processing = true;
		try {
			if (mode === 'encrypt') {
				await encrypt();
			} else {
				await decrypt();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong.';
		} finally {
			processing = false;
		}
	}

	function swapMode() {
		mode = mode === 'encrypt' ? 'decrypt' : 'encrypt';
		error = '';
		if (outputText) {
			inputText = outputText;
			outputText = '';
		}
	}

	async function copyOutput() {
		if (!outputText) return;
		await navigator.clipboard.writeText(outputText);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	async function pasteInput() {
		try {
			inputText = await navigator.clipboard.readText();
		} catch {
			// clipboard read denied or unavailable - ignore
		}
	}

	function clearAll() {
		inputText = '';
		outputText = '';
		error = '';
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
	<h1 class="font-mono text-2xl font-extrabold text-fg sm:text-3xl">AES Encryption</h1>
	<p class="mt-2 text-sm text-fg-muted">
		Encrypt and decrypt text with AES-256-GCM. Everything runs locally in your browser - nothing is
		sent anywhere.
	</p>

	<!-- Mode switch -->
	<div class="mt-6 flex flex-wrap items-center gap-3">
		<div class="inline-flex rounded-none border border-border">
			<button
				onclick={() => {
					mode = 'encrypt';
					error = '';
				}}
				class={`flex items-center cursor-pointer gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					mode === 'encrypt' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				<Lock class="h-3.5 w-3.5" />
				Encrypt
			</button>
			<button
				onclick={() => {
					mode = 'decrypt';
					error = '';
				}}
				class={`flex items-center cursor-pointer gap-1.5 border-l border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide transition ${
					mode === 'decrypt' ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg'
				}`}
			>
				<KeyRound class="h-3.5 w-3.5" />
				Decrypt
			</button>
		</div>

		<button
			onclick={swapMode}
			title="Swap input/output and mode"
			class="flex items-center cursor-pointer gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
		>
			<ArrowLeftRight class="h-3.5 w-3.5" />
			Swap
		</button>

		<div class="flex items-center gap-2">
			<label for="key-size" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				Key size
			</label>
			<div class="relative">
				<select
					id="key-size"
					bind:value={keySize}
					class="cursor-pointer appearance-none rounded-none border border-border bg-bg-alt py-1.5 pl-2 pr-7 text-xs text-fg focus:border-accent focus:outline-none"
				>
					<option value={128}>AES-128</option>
					<option value={192}>AES-192</option>
					<option value={256}>AES-256</option>
				</select>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-muted"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
				</svg>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<label for="iterations" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				PBKDF2 iterations
			</label>
			<input
				id="iterations"
				type="number"
				min="1000"
				step="1000"
				bind:value={iterations}
				class="w-24 rounded-none border border-border bg-bg-alt px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
			/>
		</div>
	</div>

	<!-- Passphrase -->
	<div class="mt-6">
		<label for="passphrase" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
			Passphrase
		</label>
		<div class="relative mt-2">
			<input
				id="passphrase"
				type={showPassphrase ? 'text' : 'password'}
				bind:value={passphrase}
				placeholder="Enter a secret passphrase..."
				class="w-full rounded-none border border-border bg-bg-alt p-3 pr-11 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
			/>
			<button
				onclick={() => (showPassphrase = !showPassphrase)}
				aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
				class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer text-fg-muted transition hover:text-fg"
			>
				{#if showPassphrase}
					<EyeOff class="h-4 w-4" />
				{:else}
					<Eye class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Input -->
	<div class="mt-6">
		<div class="flex items-center justify-between gap-2">
			<label for="input-text" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				{mode === 'encrypt' ? 'Plain text' : 'Cipher text (base64)'}
			</label>
			<div class="flex items-center gap-1">
				<button
					onclick={pasteInput}
					class="flex items-center cursor-pointer gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg"
				>
					<Clipboard class="h-3.5 w-3.5" />
					Paste
				</button>
				<button
					onclick={clearAll}
					disabled={!inputText && !outputText}
					class="flex items-center cursor-pointer gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-red-400/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
				>
					<Trash2 class="h-3.5 w-3.5" />
					Clear
				</button>
			</div>
		</div>

		<textarea
			id="input-text"
			bind:value={inputText}
			placeholder={mode === 'encrypt'
				? 'Type or paste the text you want to encrypt...'
				: 'Paste the base64 ciphertext you want to decrypt...'}
			rows="8"
			class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
		></textarea>
	</div>

	<!-- Action -->
	<div class="mt-4">
		<button
			onclick={run}
			disabled={!canSubmit}
			class="flex items-center cursor-pointer gap-2 rounded-none border border-accent bg-accent px-4 py-2 text-xs font-mono uppercase tracking-wide text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{#if mode === 'encrypt'}
				<Lock class="h-3.5 w-3.5" />
			{:else}
				<KeyRound class="h-3.5 w-3.5" />
			{/if}
			{processing ? 'Processing...' : mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
		</button>
	</div>

	{#if error}
		<div
			class="mt-4 flex items-start gap-2 rounded-none border border-red-400/50 bg-red-400/10 p-3 text-sm text-red-400"
		>
			<TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" />
			<span>{error}</span>
		</div>
	{/if}

	<!-- Output -->
	<div class="mt-6">
		<div class="flex items-center justify-between gap-2">
			<label for="output-text" class="font-mono text-xs uppercase tracking-wide text-fg-muted">
				{mode === 'encrypt' ? 'Cipher text (base64)' : 'Plain text'}
			</label>
			<button
				onclick={copyOutput}
				disabled={!outputText}
				class="flex items-center gap-1.5 rounded-none border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg-muted"
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

		<textarea
			id="output-text"
			value={outputText}
			readonly
			placeholder="Output will appear here..."
			rows="8"
			class="mt-2 w-full resize-y rounded-none border border-border bg-bg-alt p-4 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
		></textarea>
	</div>

	<div class="mt-6 flex items-start gap-2 rounded-none border border-border bg-bg-alt p-3 text-xs text-fg-muted">
		<ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
		<span>
			Uses AES-GCM (authenticated encryption) with a key derived from your passphrase via PBKDF2
			(SHA-256). A random salt and IV are generated per encryption and stored alongside the
			ciphertext, so the same input never produces the same output twice. All computation happens
			in your browser via the Web Crypto API - your passphrase and text are never transmitted.
		</span>
	</div>
</section>
