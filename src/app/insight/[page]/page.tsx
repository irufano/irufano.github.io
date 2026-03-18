import Layout, { LayoutType } from "@/components/Core/Layout";
import { getPosts, categoryToSlug } from "@/utils/posts";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";

export function generateStaticParams() {
  const { totalPosts } = getPosts(1, Infinity);
  const postsPerPage = 10;
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }));
}

export default async function PaginatedInsightPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageStr } = await params;
  const currentPage = parseInt(pageStr, 10);
  const postsPerPage = 10;
  const { paginatedPosts: posts, totalPosts } = getPosts(currentPage, postsPerPage);
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <Layout type={LayoutType.INSIGHT}>
      <div className="container mx-auto p-4 pt-24">
        <h1 className="text-4xl font-bold mb-8 text-text dark:text-text-dark">
          Insights
        </h1>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post, index) => (
            <div
              key={post.slug}
              className={`border rounded-lg overflow-hidden border-gray-200 dark:border-gray-800 shadow-sm bg-surface dark:bg-surface-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${
                index < 2 ? "lg:col-span-2" : ""
              }`}
            >
              <Link href={`/insight/post/${post.slug}`}>
                <div className={`relative w-full h-48`}>
                  <Image
                    src={post.meta.image ?? "/images/insight-default-2.svg"}
                    alt={post.meta.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </Link>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <Link href={`/insight/categories/${categoryToSlug(post.meta.category)}`} className="text-xs md:text-sm font-medium text-primary hover:underline">
                    {post.meta.category}
                  </Link>
                  <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm flex items-center">
                    <span><Calendar size={14} className="mr-2" /></span>
                    {post.meta.date}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm flex items-center">
                    <span><Clock size={14} className="mr-2" /></span>
                    {post.readingTime}
                  </p>
                </div>
                <Link href={`/insight/post/${post.slug}`}>
                  <div className="relative group">
                    <h2 className="line-clamp-2 overflow-hidden text-ellipsis text-xl font-bold text-text dark:text-text-dark">
                      {post.meta.title}
                    </h2>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex justify-between items-center mb-10">
          <div>
            <p className="px-2 text-sm md:text-base text-text dark:text-text-dark">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {currentPage > 1 && (
              <Link href={currentPage === 2 ? `/insight` : `/insight/${currentPage - 1}`}>
                <div className="p-2 px-4 rounded-md text-sm md:text-base bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:dark:bg-primary text-primary hover:text-white">
                  <p>Previous</p>
                </div>
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={`/insight/${currentPage + 1}`}>
                <div className="p-2 px-4 rounded-md text-sm md:text-base bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:dark:bg-primary text-primary hover:text-white">
                  <p>Next</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
