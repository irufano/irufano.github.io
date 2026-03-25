"use client";

import { useEffect, useMemo, useState } from "react";
import { throttle } from "lodash";
import Link from "next/link";
import { Calendar, Clock, User, Layers } from "lucide-react";
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

  const contentHtml = useMemo(
    () => (
      <div
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

          {/* Display Section Links (mobile) */}
          {sections.length > 0 && (
            <div className="block lg:hidden mb-8 lg:mb-0">
              <ExpansionTile title="Contents">
                <div className="list-none">
                  {post.sections.map((heading) => (
                    <div
                      key={heading?.id}
                      className={`mb-1 ${heading?.level === "3" ? "ml-4" : heading?.level === "4" ? "ml-8" : ""}`}
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
          <div className="my-8">
            <Comment />
          </div>
        </article>
      </div>

      {/* Section sidebar (desktop) */}
      {sections.length > 0 && (
        <aside className="lg:w-1/4 sticky max-h-[80vh] overflow-auto top-24 mb-24 self-start hidden lg:block">
          <div className="p-4 border-l-2 border-l-gray-200 dark:border-l-gray-800">
            <nav className="mb-8">
              <h2 className="ml-6 text-base font-semibold mb-2 text-gray-500">
                Contents
              </h2>
              <ul className="list-none ml-6">
                {post.sections.map((heading) => (
                  <li
                    key={heading?.id}
                    className={`mb-[0.3rem] ${heading?.level === "3" ? "ml-4" : heading?.level === "4" ? "ml-8" : ""}`}
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
