![Deploy to GitHub Pages](https://github.com/irufano/irufano.github.io/actions/workflows/deploy.yml/badge.svg)

# irufano.github.io

Personal portfolio and blog site built with Next.js, statically exported and deployed to GitHub Pages.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.x | React framework (App Router, static export) |
| React | 19.1.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first CSS |
| Remark | 15.x | Markdown processing |
| highlight.js | 11.x | Code syntax highlighting |
| next-themes | 0.4.x | Dark/light mode |
| anime.js | 3.x | Animations |

## Security

This project runs on Next.js 16.1.x with patched React 19.1.x, which addresses the critical unauthenticated Remote Code Execution (RCE) vulnerabilities:

- **CVE-2025-55182** — RCE via React Server Components
- **CVE-2025-66478** — Related RCE vector

While static exports are not directly affected, the patched versions ensure security if the deployment model changes in the future.

## Project Structure

```
├── posts/                          # Blog post content (Markdown)
│   └── <slug>/
│       └── <post>.md               # Post with frontmatter
├── public/                         # Static assets
│   ├── images/                     # Post and site images
│   └── icons/                      # Favicon and app icons
├── src/
│   ├── app/                        # App Router pages
│   │   ├── layout.tsx              # Root layout (fonts, theme, analytics)
│   │   ├── page.tsx                # Home page
│   │   └── insight/
│   │       ├── page.tsx            # Blog listing (page 1)
│   │       ├── [page]/page.tsx     # Paginated blog listing
│   │       ├── post/[slug]/        # Individual post pages
│   │       │   ├── page.tsx        # Server component (data fetching, SEO)
│   │       │   └── PostContent.tsx # Client component (scroll spy, copy code)
│   │       ├── tags/
│   │       │   ├── page.tsx        # All tags listing
│   │       │   └── [tag]/          # Posts filtered by tag
│   │       └── search/
│   │           ├── page.tsx        # Search page (server wrapper)
│   │           └── SearchContent.tsx # Client search component
│   ├── components/
│   │   ├── Core/                   # Layout, Navbar, Footer
│   │   ├── Button/                 # ThemeToggle, SearchButton, ExpansionTile
│   │   ├── Animation/              # DiagonalAnimation, LogoAnimation
│   │   ├── Home/                   # Greeting, HomeInsightCard, ToolCard
│   │   ├── Posts/                  # Comment
│   │   └── Logo/                   # SVG logo components
│   ├── utils/
│   │   ├── posts.ts                # Markdown parsing, post retrieval, pagination
│   │   ├── font.ts                 # Ubuntu font configuration
│   │   └── highlight.ts            # highlight.js initialization
│   └── styles/
│       └── globals.css             # Global styles + Tailwind imports
├── next.config.ts                  # Next.js config (static export)
├── tailwind.config.ts              # Tailwind theme customization
├── tsconfig.json                   # TypeScript configuration
└── .github/workflows/deploy.yml    # GitHub Actions deployment
```

## Getting Started

### Prerequisites

- Node.js >= 20.9.0 (22.x LTS recommended)
- npm

### Install

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because `feather-icons-react` has not yet updated its peer dependency to support React 19.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

This generates a static export in the `out/` directory.

### Lint

```bash
npm run lint
```

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions on every push to the `dev` branch.

**Workflow:** `.github/workflows/deploy.yml`

1. Checks out the repository
2. Sets up Node.js 22
3. Installs dependencies with `--legacy-peer-deps`
4. Runs `npm run build` (generates `out/` directory)
5. Creates `.nojekyll` file to prevent Jekyll processing
6. Deploys `out/` to GitHub Pages using `JamesIves/github-pages-deploy-action@v4`

## Blog Posts

### Adding a New Post

1. Create a directory under `posts/` with your desired slug:
   ```
   posts/my-new-post/
   ```

2. Add a Markdown file inside with frontmatter:
   ```markdown
   ---
   title: "My New Post"
   description: "A brief description"
   date: "2026-03-14"
   tags: ["javascript", "tutorial"]
   image: "/images/posts/my-new-post/cover.jpg"
   author: "irufano"
   ---

   Your content here...
   ```

### Markdown Features

- **Code blocks** with syntax highlighting and copy button
- **Inline code** with auto-highlighting
- **Custom blockquotes**: `[info]:`, `[warning]:`, `[caution]:`, `[tip]:`, `[important]:`, `[note]:`
- **GFM tables** with styled headers and alternating rows
- **Bold** and *italic* with custom styling

### Blockquote Example

```markdown
> [tip]: This is a helpful tip that will render with a styled container and icon.
```

## Configuration

| File | Purpose |
|---|---|
| `next.config.ts` | Static export, asset prefix, image optimization |
| `tailwind.config.ts` | Theme colors, fonts, typography plugin |
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `next-sitemap.config.js` | Sitemap generation |

### Environment

Google Analytics is configured via the `GA_TRACKING_ID` constant in `src/app/layout.tsx`. Analytics scripts only load in production.

## License

MIT
