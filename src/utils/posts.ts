import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import rSlug from "remark-slug";
import toc from "remark-toc";
import highlight from "highlight.js";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export interface PostMeta {
  title: string;
  description: string;
  date: string;
  tags: string[];
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

export function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory).filter((dir) => {
    const fullPath = path.join(postsDirectory, dir);
    return fs.statSync(fullPath).isDirectory();
  });
}

export function getPostBySlug(slug: string): Post {
  const dirPath = path.join(postsDirectory, slug);
  const files = fs.readdirSync(dirPath);

  const markdownFile = files.find((file) => file.endsWith(".md"));

  if (!markdownFile) {
    throw new Error(`No Markdown file found in directory: ${dirPath}`);
  }

  const fullPath = path.join(dirPath, markdownFile);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const readingTimeEst = calculateReadingTime(content);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processedContent = (remark() as any)
    .use(remarkGfm)
    .use(rSlug)
    .use(toc)
    .use(html, { sanitize: false })
    .use(() => (tree: unknown) => {
      // code
      visit(tree as Parameters<typeof visit>[0], "code", (node: Record<string, unknown>) => {
        const language = (node.lang as string) || "";
        const title = (node.meta as string)?.includes("title=")
          ? ((node.meta as string) || "").replaceAll(/"|title=/gi, "")
          : language;
        const highlightedCode = highlight.highlightAuto(node.value as string, [
          language,
        ]).value;
        const codeId = Math.random().toString(36).substring(7);

        node.type = "html";
        node.value = `
          <div class="code-block">
          <div class="title-code">
            <span>${title}</span>
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
          <div class="pre-code">
          <pre><code id="${codeId}" class="${language}">${highlightedCode}</code></pre>
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
          children.forEach((child) => {
            if (child?.type === "strong" && (child.children as Array<Record<string, unknown>>)?.length > 0) {
              (child.children as Array<Record<string, unknown>>)?.forEach((child2) => {
                node.type = "html";
                node.value = `<span class="emphasis-strong-block">${child2?.value}</span>`;
              });
            } else {
              node.type = "html";
              node.value = `<span class="emphasis-block">${child?.value}</span>`;
            }
          });
        } else {
          node.type = "html";
          node.value = `<span class="emphasis-block">${node?.value}</span>`;
        }
      });

      // strong
      visit(tree as Parameters<typeof visit>[0], "strong", (node: Record<string, unknown>) => {
        const children = node.children as Array<Record<string, unknown>> | undefined;
        if (children && children.length > 0) {
          children.forEach((child) => {
            node.type = "html";
            node.value = `<span class="strong-block">${child.value}</span>`;
          });
        } else {
          node.type = "html";
          node.value = `<span class="strong-block">${node.value}</span>`;
        }
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
                        .map((item) =>
                          (item?.value as string)
                            ?.replace(blockType.keyword, "")
                            ?.replace(/\n/g, "<br/>")
                        )
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
                      .map((item) =>
                        (item?.value as string)
                          ?.replace(keyword, "")
                          ?.replace(/\n/g, "<br/>")
                      )
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

      visit(tree as Parameters<typeof visit>[0], "table", (node: Record<string, unknown>) => {
        const children = node.children as Array<Record<string, unknown>>;
        // Find the first row (header row)
        const headerRow = children[0];
        if (headerRow && headerRow.type === "tableRow") {
          (headerRow.children as Array<Record<string, unknown>>).forEach((cell) => {
            cell.data = cell.data || {};
            (cell.data as Record<string, unknown>).hProperties =
              (cell.data as Record<string, unknown>).hProperties || {};
            ((cell.data as Record<string, unknown>).hProperties as Record<string, unknown>).className = "table-header";
          });
        }

        // Add className to data rows
        children.slice(1).forEach((row, index) => {
          if (row.type === "tableRow") {
            row.data = row.data || {};
            (row.data as Record<string, unknown>).hProperties =
              (row.data as Record<string, unknown>).hProperties || {};
            ((row.data as Record<string, unknown>).hProperties as Record<string, unknown>).className = `data-row ${
              index % 2 === 0 ? "even-row" : "odd-row"
            }`;
          }
        });
      });
    })
    .processSync(content);

  const contentHtml = processedContent.toString();

  // Extract headings for sections navigation
  const headings: PostHeading[] = [];
  const headingRegex = /<h([2-4]) id="(.+?)">(.+?)<\/h[2-4]>/g;
  let match;
  while ((match = headingRegex.exec(contentHtml)) !== null) {
    headings.push({ level: match[1], id: match[2], text: match[3] });
  }

  return {
    slug: slug,
    meta: data as PostMeta,
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

const calculateReadingTime = (text: string): string => {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return `${readingTime} min read`;
};
