"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers } from "lucide-react";
import type { PostSummary } from "@/utils/posts";

interface CategoryPostsListProps {
  posts: PostSummary[];
  category: string;
}

export default function CategoryPostsList({ posts, category }: CategoryPostsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const postsPerPage = 10;

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = posts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/insight/categories/${category}?page=${page}`);
  };

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="flex items-center mb-8">
        <div className="p-2 bg-primary rounded-md shadow-md">
          <Layers size={24} strokeWidth={2} className="text-white" />
        </div>
        <h1 className="text-xl md:text-2xl ml-4 font-bold text-text dark:text-text-dark">
          Category : {category}
        </h1>
      </div>

      {paginatedPosts.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {paginatedPosts.map((post) => (
            <Link key={post.slug} href={`/insight/post/${post.slug}`}>
              <li className="p-4 hover:bg-gray-200 dark:hover:bg-gray-800 hover:rounded-md">
                <p className="text-xl md:text-2xl font-bold text-primary">
                  {post.meta?.title}
                </p>
                <p className="text-sm font-semibold text-gray-500">
                  {post.meta?.date}
                </p>
                <div className="mt-2">
                  <ul className="list-none flex space-x-3 mt-2">
                    {post?.meta?.tags.map((t) => (
                      <li
                        key={t}
                        className="text-xs bg-accent dark:bg-accent-dark text-white px-2 py-1 rounded-lg"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
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
