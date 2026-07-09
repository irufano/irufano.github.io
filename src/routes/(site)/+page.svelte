<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import { SITE_URL, DEFAULT_OG_IMAGE } from '$lib/seo';

	const title = "irufano — The Developer's Knowledge Hub";
	const description =
		'Developer notes, tutorials, and docs, plus a growing collection of client-side dev tools — JSON formatting, hashing, regex testing, and more.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="{SITE_URL}/" />

	<meta property="og:type" content="website" />
	<meta property="og:url" content="{SITE_URL}/" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={DEFAULT_OG_IMAGE} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "irufano",
			"url": "https://irufano.github.io/",
			"description": "Developer notes, tutorials, and docs, plus a growing collection of client-side dev tools."
		}
	</script>
</svelte:head>

<Hero />
