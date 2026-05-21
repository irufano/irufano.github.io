import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import rSlug from "remark-slug";
import toc from "remark-toc";
import highlight from "highlight.js";
import remarkGfm from "remark-gfm";
import katex from "katex";
import { visit } from "unist-util-visit";

/**
 * Maps language identifiers (from code fences) to Devicon class names.
 * Uses "colored" variant for real brand colors.
 * Icons that are dark/black by nature (rust, github, nextjs, etc.) stay
 * uncolored so they remain visible on the dark code-block header.
 */
const langIconMap: Record<string, string> = {
  // Web fundamentals
  html: "devicon-html5-plain colored",
  css: "devicon-css3-plain colored",
  javascript: "devicon-javascript-plain colored",
  js: "devicon-javascript-plain colored",
  typescript: "devicon-typescript-plain colored",
  ts: "devicon-typescript-plain colored",
  jsx: "devicon-react-original colored",
  tsx: "devicon-react-original colored",

  // Frontend frameworks
  react: "devicon-react-original colored",
  vue: "devicon-vuejs-plain colored",
  angular: "devicon-angularjs-plain colored",
  svelte: "devicon-svelte-plain colored",
  nextjs: "devicon-nextjs-plain", // dark icon — keep white
  nuxt: "devicon-nuxtjs-plain colored",
  astro: "devicon-astro-plain", // dark icon — keep white
  ember: "devicon-ember-original-wordmark colored",

  // CSS frameworks & preprocessors
  sass: "devicon-sass-original colored",
  scss: "devicon-sass-original colored",
  less: "devicon-less-plain-wordmark", // dark icon — keep white
  tailwind: "devicon-tailwindcss-original colored",
  bootstrap: "devicon-bootstrap-plain colored",

  // Backend & general-purpose languages
  python: "devicon-python-plain colored",
  py: "devicon-python-plain colored",
  java: "devicon-java-plain colored",
  kotlin: "devicon-kotlin-plain colored",
  kt: "devicon-kotlin-plain colored",
  scala: "devicon-scala-plain colored",
  go: "devicon-go-original-wordmark colored",
  golang: "devicon-go-original-wordmark colored",
  rust: "devicon-rust-original", // dark icon — keep white
  rs: "devicon-rust-original", // dark icon — keep white
  ruby: "devicon-ruby-plain colored",
  rb: "devicon-ruby-plain colored",
  php: "devicon-php-plain colored",
  csharp: "devicon-csharp-plain colored",
  cs: "devicon-csharp-plain colored",
  c: "devicon-c-plain colored",
  cpp: "devicon-cplusplus-plain colored",
  "c++": "devicon-cplusplus-plain colored",
  objectivec: "devicon-objectivec-plain colored",
  swift: "devicon-swift-plain colored",
  dart: "devicon-dart-plain colored",
  elixir: "devicon-elixir-plain colored",
  erlang: "devicon-erlang-plain colored",
  haskell: "devicon-haskell-plain colored",
  clojure: "devicon-clojure-plain colored",
  perl: "devicon-perl-plain colored",
  lua: "devicon-lua-plain colored",
  r: "devicon-r-plain colored",
  julia: "devicon-julia-plain colored",
  groovy: "devicon-groovy-plain colored",
  zig: "devicon-zig-plain colored",
  ocaml: "devicon-ocaml-plain colored",
  fsharp: "devicon-fsharp-plain colored",

  // Mobile
  flutter: "devicon-flutter-plain colored",
  android: "devicon-android-plain colored",
  apple: "devicon-apple-original", // dark icon — keep white

  // Shell & scripting
  bash: "devicon-bash-plain", // dark icon — keep white
  sh: "devicon-bash-plain", // dark icon — keep white
  shell: "devicon-bash-plain", // dark icon — keep white
  zsh: "devicon-bash-plain", // dark icon — keep white
  powershell: "devicon-powershell-plain colored",

  // Data & config formats
  json: "devicon-json-plain colored",
  yaml: "devicon-yaml-plain", // dark icon — keep white
  yml: "devicon-yaml-plain", // dark icon — keep white
  xml: "devicon-xml-plain colored",
  toml: "devicon-tomcat-line colored",
  markdown: "devicon-markdown-original", // dark icon — keep white
  md: "devicon-markdown-original", // dark icon — keep white
  graphql: "devicon-graphql-plain colored",

  // Databases
  sql: "devicon-azuresqldatabase-plain colored",
  mysql: "devicon-mysql-plain colored",
  postgresql: "devicon-postgresql-plain colored",
  postgres: "devicon-postgresql-plain colored",
  mongodb: "devicon-mongodb-plain colored",
  redis: "devicon-redis-plain colored",
  sqlite: "devicon-sqlite-plain colored",

  // DevOps & infrastructure
  docker: "devicon-docker-plain colored",
  dockerfile: "devicon-docker-plain colored",
  kubernetes: "devicon-kubernetes-plain colored",
  terraform: "devicon-terraform-plain colored",
  nginx: "devicon-nginx-original colored",
  apache: "devicon-apache-plain colored",

  // Tools & platforms
  git: "devicon-git-plain colored",
  github: "devicon-github-original", // dark icon — keep white
  gitlab: "devicon-gitlab-plain colored",
  npm: "devicon-npm-original-wordmark colored",
  webpack: "devicon-webpack-plain colored",
  vite: "devicon-vitejs-plain colored",
  gradle: "devicon-gradle-original colored",
  cmake: "devicon-cmake-plain colored",

  // Cloud
  aws: "devicon-amazonwebservices-plain-wordmark colored",
  azure: "devicon-azure-plain colored",
  gcp: "devicon-googlecloud-plain colored",
  firebase: "devicon-firebase-plain colored",
  vercel: "devicon-vercel-original", // dark icon — keep white

  // Other
  latex: "devicon-latex-original", // dark icon — keep white
  vim: "devicon-vim-plain colored",
  wasm: "devicon-wasm-original colored",
};

function getLangIcon(lang: string): string {
  const key = lang.toLowerCase().trim();
  const iconClass = langIconMap[key];
  if (iconClass) {
    return `<i class="${iconClass}" title="${lang}"></i>`;
  }
  // Fallback: terminal icon for unknown languages
  return `<svg class="lang-icon-fallback" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 15l5-5-5-5M13 19h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderBlockquoteChild(item: Record<string, unknown>): string {
  if (!item) return "";
  const type = item.type as string;
  if (type === "link") {
    const linkChildren = item.children as Array<Record<string, unknown>> | undefined;
    const linkText = linkChildren?.map(renderBlockquoteChild).join("") ?? "";
    const href = (item.url as string) ?? "#";
    return `<a href="${href}">${linkText}</a>`;
  }
  if (type === "strong") {
    const strongChildren = item.children as Array<Record<string, unknown>> | undefined;
    return `<span class="strong-block">${strongChildren?.map(renderBlockquoteChild).join("") ?? ""}</span>`;
  }
  if (type === "emphasis") {
    const emChildren = item.children as Array<Record<string, unknown>> | undefined;
    return `<span class="emphasis-block">${emChildren?.map(renderBlockquoteChild).join("") ?? ""}</span>`;
  }
  if (type === "inlineCode") {
    const highlighted = highlight.highlightAuto(item.value as string, ["js"]).value;
    return `<span class="inline-code-block">${highlighted}</span>`;
  }
  return (item.value as string) ?? "";
}

export interface PostMeta {
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  image?: string | null;
  author?: string;
  [key: string]: unknown;
}

export interface PostHeading {
  level: string;
  id: string;
  text: string;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  content: string;
  sections: PostHeading[];
  raw: string;
  readingTime: string;
}

export interface PostSummary {
  slug: string;
  meta: PostMeta;
  rawContent: string;
  readingTime: string;
}

const postsDirectory = path.join(process.cwd(), "posts");

interface PostEntry {
  slug: string;
  category: string;
}

function getPostEntries(): PostEntry[] {
  const categories = fs.readdirSync(postsDirectory).filter((dir) => {
    return fs.statSync(path.join(postsDirectory, dir)).isDirectory();
  });

  const entries: PostEntry[] = [];
  for (const category of categories) {
    const categoryPath = path.join(postsDirectory, category);
    const slugs = fs.readdirSync(categoryPath).filter((dir) => {
      return fs.statSync(path.join(categoryPath, dir)).isDirectory();
    });
    for (const slug of slugs) {
      entries.push({ slug, category });
    }
  }
  return entries;
}

function findPostEntry(slug: string): PostEntry {
  const entry = getPostEntries().find((e) => e.slug === slug);
  if (!entry) {
    throw new Error(`No post found for slug: ${slug}`);
  }
  return entry;
}

export function getPostSlugs(): string[] {
  return getPostEntries().map((e) => e.slug);
}

export function getPostBySlug(slug: string): Post {
  const entry = findPostEntry(slug);
  const dirPath = path.join(postsDirectory, entry.category, slug);
  const files = fs.readdirSync(dirPath);

  const markdownFile = files.find((file) => file.endsWith(".md"));

  if (!markdownFile) {
    throw new Error(`No Markdown file found in directory: ${dirPath}`);
  }

  const fullPath = path.join(dirPath, markdownFile);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const readingTimeEst = calculateReadingTime(content);
  const { content: mathPlaceholders, store: mathStore } = renderMath(content);
  const withReferences = renderReferences(mathPlaceholders);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processedContent = (remark() as any)
    .use(remarkGfm)
    .use(rSlug)
    .use(toc)
    .use(html, { sanitize: false })
    .use(() => (tree: unknown) => {
      // code block
      visit(tree as Parameters<typeof visit>[0], "code", (node: Record<string, unknown>) => {
        const meta = (node.meta as string) || "";
        const language = (node.lang as string) || "";

        if (language.toLowerCase() === "mermaid") {
          const rawSource = (node.value as string).trim();
          const encodedSource = encodeURIComponent(rawSource);
          node.type = "html";
          node.value = `<div class="mermaid-diagram" data-mermaid-source="${encodedSource}"><pre class="mermaid"></pre></div>`;
          return;
        }
        const title = meta.includes("title=")
          ? meta.replaceAll(/"|title=/gi, "").replace(/line-number=\w+/gi, "").replace(/line-start=\d+/gi, "").replace(/highlight=\{[^}]*\}/gi, "").trim()
          : language;
        const showLineNumbers = /line-number=true/i.test(meta);
        const lineStartMatch = meta.match(/line-start=(\d+)/i);
        const lineStart = lineStartMatch ? parseInt(lineStartMatch[1], 10) : 1;

        // Parse highlight lines: highlight="{1,3-5,8}"
        const highlightMatch = meta.match(/highlight=\{([^}]*)\}/i);
        const highlightLines = new Set<number>();
        if (highlightMatch) {
          highlightMatch[1].split(",").forEach((part) => {
            const trimmed = part.trim();
            const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
            if (rangeMatch) {
              const start = parseInt(rangeMatch[1], 10);
              const end = parseInt(rangeMatch[2], 10);
              for (let i = start; i <= end; i++) highlightLines.add(i);
            } else if (/^\d+$/.test(trimmed)) {
              highlightLines.add(parseInt(trimmed, 10));
            }
          });
        }
        const highlightedCode = highlight.highlightAuto(node.value as string, [
          language,
        ]).value;
        const codeId = Math.random().toString(36).substring(7);

        const hasHighlight = highlightLines.size > 0;
        let codeContent: string;
        if (showLineNumbers || hasHighlight) {
          // Wrap each line in a span for line numbers and/or highlighting
          const rawLines = (node.value as string).split("\n");
          if (rawLines.length > 0 && rawLines[rawLines.length - 1] === "") rawLines.pop();
          const linesHtml = rawLines
            .map((line, i) => {
              const lineNum = i + 1;
              const highlighted = highlight.highlightAuto(line || " ", [language]).value;
              const hlClass = highlightLines.has(lineNum) ? " highlight-line" : "";
              return `<span class="code-line${hlClass}">${highlighted || " "}</span>`;
            })
            .join("");
          const preClass = showLineNumbers ? "has-line-numbers" : "has-highlight";
          const counterStyle = showLineNumbers ? ` style="counter-reset: line ${lineStart - 1}"` : "";
          codeContent = `<pre class="${preClass}"><code id="${codeId}" class="${language}"${counterStyle}>${linesHtml}</code></pre>`;
        } else {
          codeContent = `<pre><code id="${codeId}" class="${language}">${highlightedCode}</code></pre>`;
        }

        const langIcon = getLangIcon(language);
        const hasCustomTitle = meta.includes("title=");

        node.type = "html";
        node.value = `
          <div class="code-block">
          <div class="title-code">
            <span class="title-code-text">${langIcon}${hasCustomTitle ? `<span class="title-code-label">${title}</span>` : ""}</span>
            <div class="code-actions">
              <button class="wrap-code" data-code-id="${codeId}" aria-label="Toggle word wrap">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M3 12h15a3 3 0 1 1 0 6h-4m0 0 2-2m-2 2 2 2M3 18h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="copy-code" data-code-id="${codeId}" aria-label="Copy code">
                <svg
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="Edit / Copy">
                    <path
                      id="Vector"
                      d="M9 9V6.2002C9 5.08009 9 4.51962 9.21799 4.0918C9.40973 3.71547 9.71547 3.40973 10.0918 3.21799C10.5196 3 11.0801 3 12.2002 3H17.8002C18.9203 3 19.4801 3 19.9079 3.21799C20.2842 3.40973 20.5905 3.71547 20.7822 4.0918C21.0002 4.51962 21.0002 5.07967 21.0002 6.19978V11.7998C21.0002 12.9199 21.0002 13.48 20.7822 13.9078C20.5905 14.2841 20.2839 14.5905 19.9076 14.7822C19.4802 15 18.921 15 17.8031 15H15M9 9H6.2002C5.08009 9 4.51962 9 4.0918 9.21799C3.71547 9.40973 3.40973 9.71547 3.21799 10.0918C3 10.5196 3 11.0801 3 12.2002V17.8002C3 18.9203 3 19.4801 3.21799 19.9079C3.40973 20.2842 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H11.8036C12.9215 21 13.4805 21 13.9079 20.7822C14.2842 20.5905 14.5905 20.2839 14.7822 19.9076C15 19.4802 15 18.921 15 17.8031V15M9 9H11.8002C12.9203 9 13.4801 9 13.9079 9.21799C14.2842 9.40973 14.5905 9.71547 14.7822 10.0918C15 10.5192 15 11.079 15 12.1969L15 15"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </g>
                </svg>
              </button>
            </div>
          </div>
          <div class="pre-code">
          ${codeContent}
          </div>
          </div>
        `;
      });

      // inline code
      visit(tree as Parameters<typeof visit>[0], "inlineCode", (node: Record<string, unknown>) => {
        const highlightedCode = highlight.highlightAuto(node.value as string, [
          "js",
        ]).value;
        node.type = "html";
        node.value = `<span class="inline-code-block">${highlightedCode}</span>`;
      });

      // emphasis
      visit(tree as Parameters<typeof visit>[0], "emphasis", (node: Record<string, unknown>) => {
        const children = node.children as Array<Record<string, unknown>> | undefined;
        if (children && children.length > 0) {
          // ***bold-italic***: single strong child wrapping the whole content
          if (children.length === 1 && children[0]?.type === "strong") {
            const inner = (children[0].children as Array<Record<string, unknown>>) ?? [];
            const content = inner.map((c) => (c.value as string) ?? "").join("");
            node.type = "html";
            node.value = `<span class="emphasis-strong-block">${content}</span>`;
          } else {
            const content = children.map((c) => (c?.value as string) ?? "").join("");
            node.type = "html";
            node.value = `<span class="emphasis-block">${content}</span>`;
          }
        } else {
          node.type = "html";
          node.value = `<span class="emphasis-block">${(node?.value as string) ?? ""}</span>`;
        }
      });

      // strong
      visit(tree as Parameters<typeof visit>[0], "strong", (node: Record<string, unknown>) => {
        const children = node.children as Array<Record<string, unknown>> | undefined;
        const content = children && children.length > 0
          ? children.map((child) => (child.value as string) ?? "").join("")
          : (node.value as string) ?? "";
        node.type = "html";
        node.value = `<span class="strong-block">${content}</span>`;
      });

      // blockquote
      visit(tree as Parameters<typeof visit>[0], "blockquote", (node: Record<string, unknown>) => {
        const children = node.children as Array<Record<string, unknown>>;
        const blockTypes = [
          { keyword: "[info]:", className: "info-block", title: "Info", icon: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="8" />' },
          { keyword: "[warning]:", className: "warning-block", title: "Warning", icon: '<circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />' },
          { keyword: "[caution]:", className: "caution-block", title: "Caution", icon: '<circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />' },
          { keyword: "[tip]:", className: "tip-block", title: "Tip", icon: '<path d="M9 18h6m-1 4h-4a1 1 0 01-1-1v-1h6v1a1 1 0 01-1 1zM12 2a7 7 0 00-7 7c0 2.95 1.5 5.5 4 7v1h6v-1c2.5-1.5 4-4.05 4-7a7 7 0 00-7-7z"/>' },
          { keyword: "[important]:", className: "important-block", title: "Important", icon: '<path d="M3 3h18v14H8l-5 5V3z" /><path d="M12 8v4m0 4h.01" />' },
        ];

        for (const blockType of blockTypes) {
          if (
            children.length > 0 &&
            ((children[0]?.children as Array<Record<string, unknown>>)?.[0]?.value as string)?.startsWith(blockType.keyword)
          ) {
            const contents: string[] = [];

            children.forEach((child) => {
              if (child?.type === "html") {
                contents.push(
                  `<div class="content-code-block">${(child?.value as string).replace(blockType.keyword, "")}</div>`
                );
              }

              if (child?.type === "paragraph") {
                const childChildren = child.children as Array<Record<string, unknown>>;
                if (childChildren?.length > 0) {
                  const childContent = `
                    <p class="content-block">
                      ${childChildren
                      .map((item) => {
                        if (!item) return "";
                        if ((item.type as string) === "text") {
                          return ((item.value as string) ?? "")
                            .replace(blockType.keyword, "")
                            .replace(/\n/g, "<br/>");
                        }
                        return renderBlockquoteChild(item);
                      })
                      .join("")}
                    </p>
                  `;
                  contents.push(childContent);
                }
              }
            });

            node.type = "html";
            node.value = `
              <div class="${blockType.className}">
                <div class="title-block">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon-title-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${blockType.icon}
                  </svg>
                  <div class="text-title-block">${blockType.title}</div>
                </div>
                ${contents.join("")}
              </div>
            `;
            break;
          }
        }

        // [note] without title header
        if (
          children.length > 0 &&
          ((children[0]?.children as Array<Record<string, unknown>>)?.[0]?.value as string)?.startsWith("[note]:")
        ) {
          const keyword = "[note]:";
          const contents: string[] = [];

          children.forEach((child) => {
            if (child?.type === "html") {
              contents.push(
                `<div class="content-code-block">${(child?.value as string).replace(keyword, "")}</div>`
              );
            }

            if (child?.type === "paragraph") {
              const childChildren = child.children as Array<Record<string, unknown>>;
              if (childChildren?.length > 0) {
                const childContent = `
                  <p class="content-block">
                    ${childChildren
                    .map((item) => {
                      if (!item) return "";
                      if ((item.type as string) === "text") {
                        return ((item.value as string) ?? "")
                          .replace(keyword, "")
                          .replace(/\n/g, "<br/>");
                      }
                      return renderBlockquoteChild(item);
                    })
                    .join("")}
                  </p>
                `;
                contents.push(childContent);
              }
            }
          });

          node.type = "html";
          node.value = `
            <div class="note-block">
              ${contents.join("")}
            </div>
          `;
        }
      });

      // Table
      visit(tree as Parameters<typeof visit>[0], "table", (node: Record<string, unknown>) => {
        const children = node.children as Array<Record<string, unknown>>;
        const align = (node.align as (string | null)[]) || [];

        const getCellText = (cell: Record<string, unknown>): string => {
          const cellChildren = cell.children as Array<Record<string, unknown>> | undefined;
          if (!cellChildren) return "";
          return cellChildren
            .map((child) => {
              if (child.type === "text") return child.value as string;
              if (child.type === "inlineCode") {
                const highlighted = highlight.highlightAuto(child.value as string, ["js"]).value;
                return `<span class="inline-code-block">${highlighted}</span>`;
              }
              if (child.type === "strong") {
                const strongChildren = child.children as Array<Record<string, unknown>> | undefined;
                return `<span class="strong-block">${strongChildren?.map((c) => c.value).join("") || ""}</span>`;
              }
              if (child.type === "emphasis") {
                const emChildren = child.children as Array<Record<string, unknown>> | undefined;
                return `<span class="emphasis-block">${emChildren?.map((c) => c.value).join("") || ""}</span>`;
              }
              if (child.type === "link") {
                const linkChildren = child.children as Array<Record<string, unknown>> | undefined;
                const linkText = linkChildren?.map((c) => c.value).join("") || "";
                return `<a href="${child.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
              }
              return child.value as string || "";
            })
            .join("");
        };

        const getAlignStyle = (index: number): string => {
          const a = align[index];
          if (a === "center") return ' style="text-align: center;"';
          if (a === "right") return ' style="text-align: right;"';
          return "";
        };

        // Build header
        const headerRow = children[0];
        let headerHtml = "";
        if (headerRow && headerRow.type === "tableRow") {
          const headerCells = (headerRow.children as Array<Record<string, unknown>>)
            .map((cell, i) => `<th${getAlignStyle(i)}>${getCellText(cell)}</th>`)
            .join("");
          headerHtml = `<thead><tr>${headerCells}</tr></thead>`;
        }

        // Build body rows
        const bodyRows = children.slice(1).map((row, rowIndex) => {
          if (row.type !== "tableRow") return "";
          const rowClass = rowIndex % 2 === 0 ? "even-row" : "odd-row";
          const cells = (row.children as Array<Record<string, unknown>>)
            .map((cell, i) => `<td${getAlignStyle(i)}>${getCellText(cell)}</td>`)
            .join("");
          return `<tr class="${rowClass}">${cells}</tr>`;
        });
        const bodyHtml = `<tbody>${bodyRows.join("")}</tbody>`;

        node.type = "html";
        node.value = `<div class="data-table-wrapper"><div class="data-table-scroll"><table class="data-table">${headerHtml}${bodyHtml}</table></div></div>`;
      });
    })
    .processSync(withReferences);

  // Restore KaTeX HTML after remark so SVG paths never pass through remark's pipeline
  const contentHtml = processedContent.toString().replace(
    /<div class="math-placeholder" data-mid="(\d+)"><\/div>|<span class="math-placeholder" data-mid="(\d+)"><\/span>/g,
    (_: string, blockIdx: string, inlineIdx: string) => mathStore[parseInt(blockIdx ?? inlineIdx)]
  );

  // Extract headings for sections navigation
  const headings: PostHeading[] = [];
  const headingRegex = /<h([2-6]) id="(.+?)">([\s\S]+?)<\/h[2-6]>/g;
  const decodeEntities = (s: string) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  let match;
  while ((match = headingRegex.exec(contentHtml)) !== null) {
    const rawText = decodeEntities(match[3].replace(/<[^>]*>/g, "").trim());
    headings.push({ level: match[1], id: match[2], text: rawText });
  }

  return {
    slug: slug,
    meta: { ...data, category: entry.category } as PostMeta,
    content: contentHtml,
    sections: headings,
    raw: content,
    readingTime: readingTimeEst,
  };
}

export function getAllPosts(): PostSummary[] {
  const slugs = getPostSlugs();
  return slugs.map((slug) => {
    const post = getPostBySlug(slug);
    return {
      slug: post.slug,
      meta: post.meta,
      rawContent: post.raw,
      readingTime: post.readingTime,
    };
  });
}

export function getPosts(page: number = 1, postsPerPage: number = 5) {
  const allPosts = getAllPosts().sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );

  const totalPosts = allPosts.length;
  const start = (page - 1) * postsPerPage;
  const end = start + postsPerPage;
  let paginatedPosts: PostSummary[];
  if (postsPerPage === Infinity) {
    paginatedPosts = allPosts;
  } else {
    paginatedPosts = allPosts.slice(start, end);
  }

  return {
    paginatedPosts,
    totalPosts,
  };
}

export function getAllTags(): string[] {
  const slugs = getPostSlugs();
  const tags = new Set<string>();

  slugs.forEach((slug) => {
    const post = getPostBySlug(slug);
    if (post.meta.tags) {
      post.meta.tags.forEach((tag) => tags.add(tag));
    }
  });

  return Array.from(tags);
}

export function getAllPostsByTag(tag: string): PostSummary[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => {
      const post = getPostBySlug(slug);
      return {
        slug: post.slug,
        meta: post.meta,
        rawContent: post.raw,
        readingTime: post.readingTime,
      };
    })
    .filter((post) => post.meta?.tags && post.meta.tags.includes(tag))
    .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());

  return posts;
}

import { categoryToSlug } from "./slug";
export { categoryToSlug };

export function getCategoryBySlug(slug: string): string | undefined {
  const categories = getAllCategories();
  return categories.find((c) => categoryToSlug(c) === slug);
}

export function getAllCategories(): string[] {
  return fs.readdirSync(postsDirectory).filter((dir) => {
    return fs.statSync(path.join(postsDirectory, dir)).isDirectory();
  });
}

export function getAllPostsByCategory(category: string): PostSummary[] {
  const entries = getPostEntries().filter((e) => e.category === category);
  return entries
    .map((entry) => {
      const post = getPostBySlug(entry.slug);
      return {
        slug: post.slug,
        meta: post.meta,
        rawContent: post.raw,
        readingTime: post.readingTime,
      };
    })
    .sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());
}

function renderMath(markdown: string): { content: string; store: string[] } {
  const store: string[] = [];

  // Protect fenced code blocks and inline code from math replacement
  const saved: string[] = [];
  let result = markdown.replace(
    /```[\s\S]*?```|`[^`\n]+`/g,
    (match) => { saved.push(match); return `\x00SAVED${saved.length - 1}\x00`; }
  );

  // Display math: $$...$$  — store rendered HTML, emit placeholder
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        output: "html",
      });
      store.push(`<div class="math-block">${rendered}</div>`);
    } catch {
      store.push(`<div class="math-block">${formula.trim()}</div>`);
    }
    return `\n\n<div class="math-placeholder" data-mid="${store.length - 1}"></div>\n\n`;
  });

  // Inline math: $...$  (not $$) — store rendered HTML, emit placeholder
  result = result.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        output: "html",
      });
      store.push(`<span class="math-inline">${rendered}</span>`);
    } catch {
      store.push(`<span class="math-inline">${formula.trim()}</span>`);
    }
    return `<span class="math-placeholder" data-mid="${store.length - 1}"></span>`;
  });

  // Restore protected blocks
  result = result.replace(/\x00SAVED(\d+)\x00/g, (_, i) => saved[parseInt(i)]);
  return { content: result, store };
}

function renderReferences(markdown: string): string {
  // Protect code blocks
  const saved: string[] = [];
  let result = markdown.replace(
    /```[\s\S]*?```|`[^`\n]+`/g,
    (match) => { saved.push(match); return `\x00REFGUARD${saved.length - 1}\x00`; }
  );

  // Split at ## References heading
  const refMatch = result.match(/^## References\n/m);
  if (refMatch && refMatch.index !== undefined) {
    const splitIdx = refMatch.index + refMatch[0].length;
    const body = result.slice(0, splitIdx);
    const refs = result.slice(splitIdx);

    // Convert [N] and [N, M] citations in body to superscript anchor links
    const bodyLinked = body.replace(
      /\[(\d+(?:,\s*\d+)*)\]/g,
      (_, nums) =>
        nums.split(",").map((n: string) => {
          const num = n.trim();
          return `<sup><a href="#ref-${num}" class="ref-link">[${num}]</a></sup>`;
        }).join("")
    );

    // Add id anchors to reference list items at line start
    const refsAnchored = refs.replace(
      /^(\[(\d+)\])/gm,
      (_, bracket, num) => `<a id="ref-${num}"></a>${bracket}`
    );

    result = bodyLinked + refsAnchored;
  }

  // Restore code blocks
  result = result.replace(/\x00REFGUARD(\d+)\x00/g, (_, i) => saved[parseInt(i)]);
  return result;
}

const calculateReadingTime = (text: string): string => {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return `${readingTime} min read`;
};
