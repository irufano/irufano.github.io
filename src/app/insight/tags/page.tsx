import Layout, { LayoutType } from "@/components/Core/Layout";
import { getAllTags } from "@/utils/posts";
import Link from "next/link";
import { Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tags - Irufano Insight",
  description: "Browse all tags on Irufano Insight",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <Layout type={LayoutType.INSIGHT}>
      <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center mb-8">
          <div className="p-2 bg-primary rounded-md shadow-md">
            <Tag size={24} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-xl md:text-2xl ml-4 font-bold text-text dark:text-text-dark">
            Tags
          </h1>
        </div>

        <ul className="flex flex-wrap gap-y-2 gap-x-4">
          {tags.map((tag) => (
            <li key={tag} className="mb-2">
              <div>
                <Link className="w-min" href={`/insight/tags/${tag}`}>
                  <div className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 hover:dark:bg-gray-700 transition-colors duration-200">
                    <p className="text-text dark:text-text-dark">{tag}</p>
                  </div>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
