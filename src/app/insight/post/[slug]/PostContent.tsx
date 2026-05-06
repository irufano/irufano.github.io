"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { throttle } from "lodash";
import Link from "next/link";
import { Calendar, Clock, User, Layers, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import ExpansionTile from "@/components/Button/ExpansionTile";
import Comment from "@/components/Posts/Comment";
import type { Post } from "@/utils/posts";
import { categoryToSlug } from "@/utils/slug";

interface PostContentProps {
  post: Post;
  pathname: string;
}

export default function PostContent({ post, pathname }: PostContentProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const title = post.meta?.title;
  const description = post.meta?.description;
  const date = post.meta?.date;
  const sections = post.sections ?? [];
  const content = post.content;
  const tags = post.meta?.tags ?? [];
  const readingTime = post.readingTime;
  const author = post.meta?.author;
  const category = post.meta?.category;
  const thumbnail = post.meta?.image ?? null;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone/.test(navigator.userAgent));
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clearHighlights = useCallback(() => {
    if (!contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark.search-highlight");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
  }, []);

  const highlightMatches = useCallback((query: string) => {
    clearHighlights();
    if (!contentRef.current || !query.trim()) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    const treeWalker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = treeWalker.nextNode())) {
      textNodes.push(node as Text);
    }

    let count = 0;
    const lowerQuery = query.toLowerCase();

    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const lowerText = text.toLowerCase();
      if (!lowerText.includes(lowerQuery)) continue;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let searchIndex = lowerText.indexOf(lowerQuery, lastIndex);

      while (searchIndex !== -1) {
        if (searchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, searchIndex)));
        }
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.dataset.matchIndex = String(count);
        mark.textContent = text.slice(searchIndex, searchIndex + query.length);
        fragment.appendChild(mark);
        count++;
        lastIndex = searchIndex + query.length;
        searchIndex = lowerText.indexOf(lowerQuery, lastIndex);
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode?.replaceChild(fragment, textNode);
    }

    setMatchCount(count);
    if (count > 0) {
      setCurrentMatch(1);
      scrollToMatch(1);
    } else {
      setCurrentMatch(0);
    }
  }, [clearHighlights]);

  const scrollToMatch = (index: number) => {
    if (!contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark.search-highlight");
    marks.forEach((m) => m.classList.remove("current"));
    const target = marks[index - 1];
    if (!target) return;
    target.classList.add("current");
    const navbar = document.querySelector("nav");
    const offset = navbar ? navbar.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const goToNextMatch = () => {
    if (matchCount === 0) return;
    const next = currentMatch < matchCount ? currentMatch + 1 : 1;
    setCurrentMatch(next);
    scrollToMatch(next);
  };

  const goToPrevMatch = () => {
    if (matchCount === 0) return;
    const prev = currentMatch > 1 ? currentMatch - 1 : matchCount;
    setCurrentMatch(prev);
    scrollToMatch(prev);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      highlightMatches(value);
    } else {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatch(0);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    clearHighlights();
    setMatchCount(0);
    setCurrentMatch(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && searchQuery) {
        clearSearch();
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, clearHighlights]);

  const searchBar = (
    <div className="relative flex items-center mb-3">
      <Search size={14} className="absolute left-2 text-gray-400 ml-1 lg:ml-0" />
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) goToPrevMatch();
            else goToNextMatch();
          }
        }}
        placeholder="Search in post..."
        className="w-full pl-8 pr-20 py-3 lg:py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {!searchQuery && (
        <kbd className="absolute right-2 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 pointer-events-none">
          {isMac ? "⌘F" : "Ctrl+F"}
        </kbd>
      )}
      {searchQuery && (
        <div className="absolute right-1 flex items-center gap-0.5">
          <span className="text-[10px] text-gray-400 mr-1">
            {matchCount > 0 ? `${currentMatch}/${matchCount}` : "0"}
          </span>
          <button onClick={goToPrevMatch} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Previous match">
            <ChevronUp size={12} />
          </button>
          <button onClick={goToNextMatch} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Next match">
            <ChevronDown size={12} />
          </button>
          <button onClick={clearSearch} className="mr-2 lg:mr-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Clear search">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );

  const contentHtml = useMemo(
    () => (
      <div
        ref={contentRef}
        className="prose prose-lg dark:prose-dark max-w-3xl dark:text-[#d9d7d2] text-base md:text-lg"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    ),
    [content]
  );

  useEffect(() => {
    const calculateOffset = () => {
      const navbar = document.querySelector("nav");
      return navbar ? navbar.offsetHeight : 0;
    };

    const handleScroll = throttle(() => {
      const offset = calculateOffset();
      const threshold = offset + 32;

      let currentSection: string | null = null;
      for (let i = post.sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(post.sections[i].id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= threshold) {
            currentSection = post.sections[i].id;
            break;
          }
        }
      }

      if (currentSection) {
        setActiveSection(currentSection);
      }
    }, 100);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [post.sections]);

  // Handle direct URL with hash (e.g. /post/my-post#section-id)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    // Wait for content to render
    const timeout = setTimeout(() => {
      const element = document.getElementById(hash);
      if (!element) return;
      const navbar = document.querySelector("nav");
      const offset = navbar ? navbar.offsetHeight : 0;
      const top = element.getBoundingClientRect().top + window.scrollY - offset - 16;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveSection(hash);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const sectionIndent = (level: string) => {
    switch (level) {
      case "3": return "ml-4";
      case "4": return "ml-8";
      case "5": return "ml-12";
      case "6": return "ml-16";
      default:  return "";
    }
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const navbar = document.querySelector("nav");
    const offset = navbar ? navbar.offsetHeight : 0;
    const top = element.getBoundingClientRect().top + window.scrollY - offset - 16;
    window.scrollTo({ top, behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  };

  useEffect(() => {
    if (!contentRef.current) return;
    const wrappers = Array.from(
      contentRef.current.querySelectorAll<HTMLElement>(".mermaid-diagram[data-mermaid-source]")
    );
    if (wrappers.length === 0) return;
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        securityLevel: "loose",
      });
      // Restore pre elements inside async callback using textContent (safe for any diagram source)
      wrappers.forEach(wrapper => {
        wrapper.innerHTML = "";
        const pre = document.createElement("pre");
        pre.className = "mermaid";
        pre.textContent = decodeURIComponent(wrapper.getAttribute("data-mermaid-source") ?? "");
        wrapper.appendChild(pre);
      });
      const blocks = wrappers
        .map(w => w.querySelector<HTMLElement>("pre.mermaid"))
        .filter((el): el is HTMLElement => el !== null);
      if (blocks.length > 0) {
        mermaid.run({ nodes: blocks }).then(() => {
          // Strip the inline background style mermaid sets on the SVG element
          wrappers.forEach(wrapper => {
            wrapper.querySelectorAll<SVGElement>("svg").forEach(svg => {
              svg.style.background = "transparent";
              svg.style.backgroundColor = "transparent";
            });
          });
        });
      }
    });
  }, [content, isDark]);

  useEffect(() => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll<HTMLElement>(
      "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"
    );
    headings.forEach((heading) => {
      if (heading.querySelector(".heading-anchor")) return;
      const id = heading.getAttribute("id")!;
      const anchor = document.createElement("a");
      anchor.href = `#${id}`;
      anchor.className = "heading-anchor";
      anchor.setAttribute("aria-label", `Link to: ${heading.textContent?.trim()}`);
      anchor.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0.7em" height="0.7em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
      heading.appendChild(anchor);
    });
  }, [content]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".wrap-code")) {
        const button = target.closest(".wrap-code") as HTMLElement;
        const codeId = button.getAttribute("data-code-id");
        if (!codeId) return;
        const codeBlock = button.closest(".code-block");
        if (!codeBlock) return;
        const preCode = codeBlock.querySelector(".pre-code");
        if (!preCode) return;
        preCode.classList.toggle("wrapped");
        button.classList.toggle("active");
        return;
      }

      const headingAnchor = target.closest(".heading-anchor") as HTMLAnchorElement | null;
      if (headingAnchor) {
        e.preventDefault();
        const id = headingAnchor.getAttribute("href")?.slice(1);
        if (!id) return;
        const element = document.getElementById(id);
        if (!element) return;
        const navbar = document.querySelector("nav");
        const offset = navbar ? navbar.offsetHeight : 0;
        const top = element.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top, behavior: "smooth" });
        window.history.replaceState(null, "", `#${id}`);
        return;
      }

      const refLink = target.closest('a[href^="#ref-"]') as HTMLAnchorElement | null;
      if (refLink) {
        e.preventDefault();
        const id = refLink.getAttribute("href")?.slice(1);
        if (!id) return;
        const element = document.getElementById(id);
        if (!element) return;
        const navbar = document.querySelector("nav");
        const offset = navbar ? navbar.offsetHeight : 0;
        const top = element.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top, behavior: "smooth" });
        window.history.replaceState(null, "", `#${id}`);
        return;
      }

      if (target.closest(".copy-code")) {
        const button = target.closest(".copy-code") as HTMLElement;
        const codeId = button.getAttribute("data-code-id");
        if (!codeId) return;
        const codeEl = document.getElementById(codeId);
        if (!codeEl) return;
        const codeLines = codeEl.querySelectorAll(".code-line");
        const codeToCopy = codeLines.length > 0
          ? Array.from(codeLines).map((line) => line.textContent || "").join("\n")
          : codeEl.textContent || "";
        navigator.clipboard.writeText(codeToCopy).then(() => {
          button.innerHTML =
            '<svg class="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>';
          setTimeout(() => {
            button.innerHTML =
              '<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="Edit / Copy"><path id="Vector" d="M9 9V6.2002C9 5.08009 9 4.51962 9.21799 4.0918C9.40973 3.71547 9.71547 3.40973 10.0918 3.21799C10.5196 3 11.0801 3 12.2002 3H17.8002C18.9203 3 19.4801 3 19.9079 3.21799C20.2842 3.40973 20.5905 3.71547 20.7822 4.0918C21.0002 4.51962 21.0002 5.07967 21.0002 6.19978V11.7998C21.0002 12.9199 21.0002 13.48 20.7822 13.9078C20.5905 14.2841 20.2839 14.5905 19.9076 14.7822C19.4802 15 18.921 15 17.8031 15H15M9 9H6.2002C5.08009 9 4.51962 9 4.0918 9.21799C3.71547 9.40973 3.40973 9.71547 3.21799 10.0918C3 10.5196 3 11.0801 3 12.2002V17.8002C3 18.9203 3 19.4801 3.21799 19.9079C3.40973 20.2842 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H11.8036C12.9215 21 13.4805 21 13.9079 20.7822C14.2842 20.5905 14.5905 20.2839 14.7822 19.9076C15 19.4802 15 18.921 15 17.8031V15M9 9H11.8002C12.9203 9 13.4801 9 13.9079 9.21799C14.2842 9.40973 14.5905 9.71547 14.7822 10.0918C15 10.5192 15 11.079 15 12.1969L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></g></svg>';
          }, 2000);
        });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="container mx-auto pt-20 md:pt-24 lg:flex lg:flex-row">
      {/* Article */}
      <div className="mx-auto p-4">
        <article className="prose prose-lg dark:prose-dark max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-text dark:text-text-heading">
            {title}
          </h1>
          <div className="flex flex-wrap gap-x-4 mb-8 [&>p]:!mb-1">
            <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
              <span><Layers size={14} className="mr-2 text-primary" /></span>
              <Link href={`/insight/categories/${categoryToSlug(post.meta.category)}`} className="text-gray-700 dark:text-gray-300 no-underline hover:underline hover:text-primary">
                {category}
              </Link>
            </p>
            <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
              <span><Calendar size={14} className="mr-2 text-primary" /></span>
              {date}
            </p>
            <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
              <span><Clock size={14} className="mr-2 text-primary" /></span>
              {readingTime}
            </p>
            <p className="flex items-center mt-2 text-xs md:text-sm">
              <span><User size={14} className="mr-2 text-primary" /></span>
              <Link
                href={"https://github.com/irufano"}
                className="text-gray-700 dark:text-gray-300 no-underline font-normal hover:text-primary dark:hover:text-primary-dark"
              >
                {author}
              </Link>
            </p>
          </div>

          {/* Search and Section Links (mobile) */}
          {sections.length > 0 && (
            <div className="block lg:hidden mb-8 lg:mb-0">
              <div className="sticky top-20 z-10 bg-white dark:bg-gray-900 pb-1">
                {searchBar}
              </div>
              <ExpansionTile title="Contents">
                <div className="list-none">
                  {post.sections.map((heading) => (
                    <div
                      key={heading?.id}
                      className={`mb-1 ${sectionIndent(heading?.level)}`}
                    >
                      <a
                        href={`#${heading?.id}`}
                        onClick={(e) => scrollToSection(e, heading?.id)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary no-underline"
                      >
                        {heading?.text}
                      </a>
                    </div>
                  ))}
                </div>
              </ExpansionTile>
            </div>
          )}

          {/* Thumbnail */}
          {thumbnail != null ? (
            <div className="mb-4">
              <Image
                src={thumbnail}
                alt={`${title} image`}
                fill
                className="!relative rounded-md shadow-sm mb-0"
              />
              <div className="flex justify-center mt-4 text-xs">
                <p className="p-0 mt-0 ">
                  <i>
                    Thumbnail{" "}
                    <a className="no-underline" rel="stylesheet" href={thumbnail}>
                      Credit
                    </a>
                  </i>
                </p>
              </div>
            </div>
          ) : null}

          {/* Post Content */}
          {contentHtml}

          {/* Tags */}
          <div className="my-8">
            <h4 className="text-lg font-semibold text-text dark:text-text-dark">
              Tags:
            </h4>
            <div className="list-none flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/insight/tags/${tag}`} className="no-underline">
                  <div className="text-sm bg-accent dark:bg-accent-dark text-white px-2 py-1 rounded-md hover:bg-accent/70 dark:hover:bg-accent-dark/70 transition-colors duration-200">
                    {tag}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Comment */}
          {/* <div className="my-8">
            <Comment />
          </div> */}
        </article>
      </div>

      {/* Section sidebar (desktop) */}
      {sections.length > 0 && (
        <aside className="lg:w-[28%] sticky max-h-[80vh] top-24 mb-24 self-start hidden lg:flex lg:flex-col">
          <div className="px-4 pt-2 border-l-2 border-l-gray-200 dark:border-l-gray-800 flex flex-col min-h-0 flex-1">
            <div className="mx-6 shrink-0 pb-2">
              {searchBar}
            </div>
            <nav className="pr-6 mb-8 overflow-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              <h2 className="ml-6 text-base font-semibold mb-2 text-gray-500">
                Contents
              </h2>
              <ul className="list-none ml-6">
                {post.sections.map((heading) => (
                  <li
                    key={heading?.id}
                    className={`mb-[0.3rem] ${sectionIndent(heading?.level)}`}
                  >
                    <a
                      href={`#${heading?.id}`}
                      onClick={(e) => scrollToSection(e, heading?.id)}
                      className={`text-xs text-gray-500 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary ${activeSection === heading?.id ? "text-primary dark:text-primary" : ""
                        }`}
                    >
                      {heading?.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
