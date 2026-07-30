# irufano

**The developer's knowledge hub** - a personal site combining a technical blog with a set of small, client-side developer tools. Built with Svelte 5, SvelteKit, Tailwind CSS 4, and Bun, and fully prerendered for static hosting on GitHub Pages.

## What's here

- **Posts** (`/posts`) - developer notes and docs written as Markdown files under `posts/<Category>/<slug>/`, organized automatically into categories and tags. The rendering pipeline (`src/lib/server/markdown/`) supports GitHub-flavored Markdown, syntax-highlighted code blocks (Shiki), math via KaTeX, Mermaid diagrams, callouts, and a generated table of contents.
- **Tools** (`/tools`) - a collection of self-contained, client-side utilities (JSON formatter, Base64/AES/hash/JWT tools, regex tester, color converter, Markdown table/tree generators, and more), grouped into categories and listed in `src/lib/tools.ts`.
- **Theme picker** - a dark/light theme switcher with a dozen-plus palettes (Catppuccin, Dracula, Nord, Tokyo Night, Gruvbox, One Dark/Light, Solarized, Kanagawa, Rosé Pine, Vesper, Terminal), kept in sync with the Shiki code-highlighting theme (`src/lib/theme.svelte.ts`).

## Creating a project

This project was originally scaffolded with [`sv`](https://github.com/sveltejs/cli):

```sh
bun x sv@0.16.2 create --template minimal --types ts --install bun .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `npm run preview`.

## Adding a new post

Posts are plain Markdown files at the repo root under `posts/`, one directory per post:

```
posts/<Category>/<post-slug>/<anything>.md
```

- `<Category>` becomes the post's category, exactly as written (e.g. `Git`, `Machine Learning`). It's slugified automatically for URLs - no separate category config to update.
- `<post-slug>` (the directory name, not the filename) becomes the post's URL slug. The `.md` filename itself doesn't matter, but stick to one Markdown file per directory.

### 1. Create the file

```sh
mkdir -p "posts/Git/my-new-post"
```

```md
---
title: "My New Post"
date: "2026-07-09"
description: "One or two sentences describing the post."
author: "irufano"
tags:
  - Git
image: "https://example.com/cover.png"
---

Post content starts here.
```

Frontmatter fields (see `src/lib/server/posts.ts`):

| Field         | Required | Notes                                      |
| ------------- | -------- | ------------------------------------------- |
| `title`       | yes      | Falls back to the directory name if omitted |
| `date`        | yes      | Used for sort order on the posts list       |
| `description` | yes      | Shown on post cards and in `<meta>` tags    |
| `author`      | yes      |                                              |
| `tags`        | yes      | Array; each tag becomes a `/posts/tag/...` page |
| `image`       | no       | Cover image URL                             |

### 2. Use the supported Markdown features

The rendering pipeline (`src/lib/server/markdown/`) supports:

- GitHub-flavored Markdown (tables, task lists, strikethrough, etc.)
- Syntax-highlighted code blocks via Shiki - ` ```ts `, ` ```bash `, etc.
- Math via KaTeX - inline `$E = mc^2$` and block `$$ ... $$`
- Mermaid diagrams - ` ```mermaid ` fenced blocks
- Callouts - GitHub-style `> [!NOTE]` / `> [!TIP]` / `> [!WARNING]` / `> [!CAUTION]` / `> [!IMPORTANT]`, or this project's own `[info]: ...` marker

### 3. Preview and verify

```sh
bun run dev
```

Visit `http://localhost:5173/posts/<category-slug>/<post-slug>` to check rendering.

Before pushing, run `bun run build` at least once - the whole site prerenders, so any relative link in your post content that points to a file that doesn't exist (e.g. `[link](./missing.md)`) will crash the build rather than just 404 at runtime. Use absolute URLs for anything outside the post itself.

## Configuring SEO

SEO for the whole site is centered on one file: `src/lib/seo.ts`.

```ts
export const SITE_URL = 'https://irufano.github.io';
export const SITE_NAME = 'irufano';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
```

- **`SITE_URL`** - used to build every canonical link and `og:url`/Open Graph value, and to generate `sitemap.xml`. This is the one thing you must update if you ever deploy under a different domain or as a project page (see [Deploying as a project page instead](#deploying-as-a-project-page-instead)).
- **`DEFAULT_OG_IMAGE`** - the fallback social-share image (`static/og-image.png`, 1200×630) used on any page that doesn't have its own image (posts can override it via the `image` frontmatter field).

### Per-page tags

Every route sets its own tags in a `<svelte:head>` block: `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph (`og:*`), and Twitter Card (`twitter:*`) tags. When adding a new route, copy the pattern from an existing one (e.g. `src/routes/tools/json-formatter/+page.svelte`) rather than inventing a new shape.

The post detail page (`src/routes/(site)/posts/[category]/[slug]/+page.svelte`) goes further: it sets `og:type="article"`, `article:published_time`, `article:author`, `article:tag`, and emits `BlogPosting` JSON-LD structured data built from the post's frontmatter. Because SvelteKit reuses that page component when navigating between posts, all of this is computed with `$derived`/`$derived.by`, not plain `const` - otherwise the tags would go stale after a client-side navigation to a different post.

### Sitemap and robots.txt

`sitemap.xml` isn't a static file - it's generated at build time by `src/routes/sitemap.xml/+server.ts`, which reads `getAllPosts()`, `getAllTags()`, and `TOOLS` and prerenders one `<url>` entry per post, tag, and tool, plus the static routes (`/`, `/posts`, `/tools`). New posts and tools are picked up automatically; don't add a `static/sitemap.xml` file, it would conflict with this route.

`static/robots.txt` allows all crawling and points to `${SITE_URL}/sitemap.xml`. If you change `SITE_URL`, update the `Sitemap:` line here too - it's the one place the URL isn't read from `src/lib/seo.ts`.

### Verifying

```sh
bun run build
```

Then check `build/sitemap.xml` for the expected URLs, and view-source (or `grep`) a page under `build/` for `<link rel="canonical">`, `og:*`, and `application/ld+json` to confirm the tags rendered as expected.

## Deploying to GitHub Pages

This project is pre-configured with `@sveltejs/adapter-static` and prerenders the whole site, so it can be hosted directly on GitHub Pages - no extra build tooling required.

### 1. Push the repo to GitHub

If this folder isn't a git repo yet:

```sh
git init
git add .
git commit -m "Initial commit"
```

Create an empty repository on GitHub named **`irufano.github.io`** (this is a user-page repo, served from the domain root - no base path needed), then add it as the remote and push your work branch:

```sh
git remote add origin https://github.com/irufano/irufano.github.io.git
git branch -M dev
git push -u origin dev
```

### 2. Enable GitHub Pages

In the repo on GitHub, go to **Settings → Pages** and set **Source** to **Deploy from a branch**, then pick the **`public`** branch (created automatically by the workflow the first time it runs - see below).

### 3. Let the workflow deploy it

The workflow in `.github/workflows/deploy.yml` triggers automatically on every push to `dev`. It:

1. Installs dependencies with Bun.
2. Runs `bun run build`, which prerenders the whole site into `build/`.
3. Pushes the contents of `build/` to the **`public`** branch (via `peaceiris/actions-gh-pages`), overwriting its history each time.

You can watch progress under the repo's **Actions** tab. Once the workflow finishes, the site is live at `https://irufano.github.io/`.

To trigger a deploy without pushing new commits, use the **Run workflow** button on the `Deploy to GitHub Pages` workflow (it's also wired to `workflow_dispatch`).

Day-to-day development happens on `dev`; `public` is a generated, build-only branch - never commit to it directly, since the next deploy force-pushes over it.

### Deploying as a project page instead

If you deploy under a different username/repo (a project page, e.g. `github.com/<user>/<repo>` served at `https://<user>.github.io/<repo>/` instead of the domain root), update:

- `paths.base` in `vite.config.ts` - set it to `/<repo-name>`, matching your repo.
- `SITE_URL` in `src/lib/seo.ts` - the single source of truth for canonical URLs, Open Graph/Twitter tags, and the sitemap (`src/routes/sitemap.xml/+server.ts`).
- The hardcoded `https://irufano.github.io/sitemap.xml` URL in `static/robots.txt`.

### Troubleshooting

- **Build fails with a 404 during prerendering** (e.g. `Error: 404 /some/path (linked from ...)`) - since the whole site prerenders, SvelteKit's crawler follows every internal link reachable from a route, including links inside Markdown post content under `posts/`. Fix or remove the broken link; don't suppress it unless you're sure the target is intentionally missing.
- **Site deploys but assets 404 / page looks unstyled** - make sure `static/.nojekyll` exists and ends up in `build/`. GitHub Pages runs Jekyll by default, which ignores `_app/`-style underscore-prefixed folders that SvelteKit's client assets live in.
- **Workflow doesn't run** - confirm you pushed to `dev` (the trigger branch); pushes to other branches won't fire it.
- **Pages shows a 404 / isn't picking up new deploys** - confirm **Settings → Pages → Source** is **Deploy from a branch → `public`**, not **GitHub Actions**.
