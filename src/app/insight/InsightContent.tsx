"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Search, Layers, ChevronDown } from "lucide-react";
import type { PostSummary } from "@/utils/posts";

interface InsightContentProps {
  posts: PostSummary[];
  categories: string[];
}

export default function InsightContent({ posts, categories }: InsightContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory && categories.includes(initialCategory) ? initialCategory : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInCategory, setSearchInCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (selectedCategory && (!searchQuery.trim() || searchInCategory)) {
      result = result.filter((post) => post.meta.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((post) =>
        post.meta.title.toLowerCase().includes(query)
      );
    }
    return result;
  }, [posts, selectedCategory, searchQuery, searchInCategory]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    if (category) {
      router.push(`/insight?category=${encodeURIComponent(category)}`, { scroll: false });
    } else {
      router.push("/insight", { scroll: false });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-4 pt-24 pb-16">
      {/* Header: Title + Search */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-8">
        <h1 className="text-3xl items-start  font-bold text-text dark:text-text-dark">
          Insights
        </h1>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          {selectedCategory ? (
            <label className="flex items-center gap-2 cursor-pointer select-none mb-2 sm:mb-0">
              <input
                type="checkbox"
                checked={searchInCategory}
                onChange={(e) => {
                  setSearchInCategory(e.target.checked);
                  setCurrentPage(1);
                }}
                className="accent-primary w-4 h-4"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Search in &quot;{selectedCategory}&quot; only
              </span>
            </label>
          ) : <div className="sm:w-4 sm:h-4" />}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          {/* Categories */}
          <div>
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center justify-between w-full gap-2 mb-3 lg:cursor-default"
            >
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-text dark:text-text-dark uppercase tracking-wide">
                  Categories
                </h2>
                {!categoriesOpen && selectedCategory && (
                  <span className="lg:hidden text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                    {selectedCategory}
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`lg:hidden text-gray-400 transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div className={`${categoriesOpen ? "block" : "hidden"} lg:block`}>
              <div className="relative mb-4">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
              <li>
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 ${selectedCategory === null
                      ? "bg-primary text-white font-medium"
                      : "text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  All
                </button>
              </li>
              {categories.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase())).map((category) => (
                <li key={category}>
                  <button
                    onClick={() => handleCategoryClick(category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 ${selectedCategory === category
                        ? "bg-primary text-white font-medium"
                        : "text-text dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Posts */}
        <div className="flex-1 min-w-0">
          {paginatedPosts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {paginatedPosts.map((post) => (
                <div
                  key={post.slug}
                  className="flex flex-col sm:flex-row border rounded-lg overflow-hidden border-gray-200 dark:border-gray-800 shadow-sm bg-surface dark:bg-surface-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <Link href={`/insight/post/${post.slug}`} className="sm:w-60 shrink-0">
                    <div className="relative w-full h-48 sm:h-full">
                      <Image
                        src={post.meta.image ?? "/images/insight-default-2.svg"}
                        alt={post.meta.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </Link>
                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                      <button
                        onClick={() => handleCategoryClick(post.meta.category)}
                        className="text-xs md:text-sm font-medium text-primary hover:underline"
                      >
                        {post.meta.category}
                      </button>
                      <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm flex items-center">
                        <span>
                          <Calendar size={14} className="mr-2" />
                        </span>
                        {post.meta.date}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm flex items-center">
                        <span>
                          <Clock size={14} className="mr-2" />
                        </span>
                        {post.readingTime}
                      </p>
                    </div>
                    <Link href={`/insight/post/${post.slug}`}>
                      <h2 className="line-clamp-2 overflow-hidden text-ellipsis text-xl font-bold text-text dark:text-text-dark">
                        {post.meta.title}
                      </h2>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-text dark:text-text-dark">No posts found.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-between items-center mb-10">
              <div>
                <p className="px-2 text-sm md:text-base text-text dark:text-text-dark">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {currentPage > 1 && (
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-2 px-4 rounded-md text-sm md:text-base bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:dark:bg-primary text-primary hover:text-white"
                  >
                    Previous
                  </button>
                )}
                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-2 px-4 rounded-md text-sm md:text-base bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:dark:bg-primary text-primary hover:text-white"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
