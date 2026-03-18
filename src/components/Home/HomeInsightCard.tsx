import { Calendar, Clock, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PostSummary, categoryToSlug } from "@/utils/posts";

interface HomeInsightsCardProps {
  posts: PostSummary[];
  bg?: string;
}

const HomeInsightsCard = ({
  posts,
  bg = "bg-surface dark:bg-surface-dark",
}: HomeInsightsCardProps) => {
  return (
    <div className={`cursor-pointer rounded-lg shadow-md ${bg}`}>
      <ul className="space-y-0 divide-y divide-slate-100 dark:divide-slate-900">
        {posts.map((post) => (
          <li key={post.slug}>
            <div className={cn("hover:bg-gray-50 hover:dark:bg-gray-800 rounded-md p-6", "transition-colors duration-200")}>
              <Link href={`/insight/categories/${categoryToSlug(post?.meta?.category ?? "")}`} className="text-xs font-medium text-primary hover:underline mb-1 inline-block">
                {post?.meta?.category ?? ""}
              </Link>
              <Link href={`/insight/post/${post.slug}`}>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {post?.meta?.title ?? "-"}
                </h3>
                <div className="flex space-x-4">
                  <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      <Calendar
                        size={14}
                        className="mr-2 text-primary"
                      />
                    </span>
                    {post?.meta?.date ?? "-"}
                  </p>
                  <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      <Clock
                        size={14}
                        className="mr-2 text-primary"
                      />
                    </span>
                    {post?.readingTime ?? "-"}
                  </p>
                </div>
                <div className="mt-2">
                  <ul className="list-none flex flex-wrap items-start space-x-2">
                    {post?.meta?.tags?.slice(0, 4).map((tag, index) => (
                      <li
                        key={index}
                        className="text-xs bg-accent dark:bg-accent-dark text-white mt-2 px-2 py-1 rounded-lg"
                      >
                        {tag}
                      </li>
                    ))}
                    {post?.meta?.tags?.length > 4 ? (
                      <li className="text-xs bg-accent dark:bg-accent-dark text-white mt-2 px-2 py-1 rounded-lg">
                        ...
                      </li>
                    ) : (
                      <></>
                    )}
                  </ul>
                </div>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Link href={"/insight"}>
        <div className="bg-teal-100 dark:bg-teal-900 hover:bg-primary/50 hover:dark:bg-teal-950 rounded-b-md p-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            See more insights
          </h3>
          <ArrowRight
            size={30}
            strokeWidth={3}
            className="text-text dark:text-text-dark"
          />
        </div>
      </Link>
    </div>
  );
};

export default HomeInsightsCard;
