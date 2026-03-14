"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import type { PostSummary } from "@/utils/posts";

interface SearchContentProps {
  posts: PostSummary[];
}

export default function SearchContent({ posts }: SearchContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const postsPerPage = 10;

  const filteredPosts = posts.filter((post) => {
    return (
      post.meta?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.rawContent?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    router.push(`/insight/search?query=${encodeURIComponent(searchQuery)}&page=1`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/insight/search?query=${encodeURIComponent(searchQuery)}&page=${page}`);
  };

  function extractSubstring(paragraph: string, keyword: string): string {
    const cleanedParagraph = paragraph
      .replace(/[#!,\[\]\-`\{\}\=\;\(\)]/g, "")
      .trim()
      .toLowerCase();

    const keywordIndex = cleanedParagraph.toLowerCase().indexOf(keyword.toLowerCase());

    if (keywordIndex === -1) return "";

    let start = Math.max(0, keywordIndex - Math.floor((36 - keyword.length) / 2));
    if (start + 36 > cleanedParagraph.length) {
      start = Math.max(0, cleanedParagraph.length - 36);
    }

    let substring = cleanedParagraph.substr(start, 36);
    substring = highlightText(substring, keyword);

    return `...${substring}...`;
  }

  function highlightText(text: string, keyword: string): string {
    const keywordRegex = new RegExp(keyword, "gi");
    return text.replace(
      keywordRegex,
      (match) => `<span style="background-color: yellow; color: black;">${match}</span>`
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="flex items-center mb-8">
        <div className="p-2 bg-primary rounded-md shadow-md">
          <Search size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <h1 className="text-2xl ml-4 font-bold text-text dark:text-text-dark">
          Search Insight Posts
        </h1>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setCurrentPage(1);
            setSearchQuery(e.target.value);
          }}
          placeholder="Search posts..."
          className="px-4 py-2 text-text dark:text-text-dark border-2 rounded-md w-full bg-surface dark:bg-surface-dark border-gray-200 dark:border-gray-800 focus:border-emerald-600 dark:focus:border-emerald-600 transition-colors duration-200"
        />
      </form>

      {searchQuery && (
        <p className="mb-4 text-text dark:text-text-dark">
          Results for: <span className="font-semibold">{searchQuery}</span>
        </p>
      )}

      {paginatedPosts.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {paginatedPosts.map((post) => (
            <Link key={post.slug} href={`/insight/post/${post.slug}`}>
              <li className="p-4 hover:bg-gray-200 dark:hover:bg-gray-800 hover:rounded-md">
                <p className="text-xl md:text-2xl font-bold text-primary">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightText(post.meta?.title, searchQuery.toLowerCase()),
                    }}
                  />
                </p>
                <p className="text-sm font-semibold text-gray-500">{post.meta?.date}</p>
                {searchQuery && (
                  <div className="text-sm">
                    <span
                      className="prose prose-lg dark:prose-dark"
                      dangerouslySetInnerHTML={{
                        __html: extractSubstring(post.rawContent, searchQuery.toLowerCase()),
                      }}
                    />
                  </div>
                )}
              </li>
            </Link>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-text dark:text-text-dark">No posts found.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-between items-center mb-10">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 px-4 rounded-md text-sm md:text-base bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:dark:bg-primary text-primary hover:text-white disabled:text-gray-300 dark:disabled:text-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 transition-colors duration-200"
          >
            <p>Previous</p>
          </button>
          <div>
            <p className="px-2 text-sm md:text-base text-text dark:text-text-dark">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 px-4 rounded-md text-sm md:text-base bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:dark:bg-primary text-primary hover:text-white disabled:text-gray-300 dark:disabled:text-gray-700 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 transition-colors duration-200"
          >
            <p>Next</p>
          </button>
        </div>
      )}
    </div>
  );
}
