import Layout, { LayoutType } from "@/components/Core/Layout";
import { getAllCategories, categoryToSlug } from "@/utils/posts";
import Link from "next/link";
import { Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories - Irufano Insight",
  description: "Browse all categories on Irufano Insight",
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <Layout type={LayoutType.INSIGHT}>
      <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center mb-8">
          <div className="p-2 bg-primary rounded-md shadow-md">
            <Layers size={24} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-xl md:text-2xl ml-4 font-bold text-text dark:text-text-dark">
            Categories
          </h1>
        </div>

        <ul className="flex flex-wrap gap-y-2 gap-x-4">
          {categories.map((category) => (
            <li key={category} className="mb-2">
              <div>
                <Link className="w-min" href={`/insight/categories/${categoryToSlug(category)}`}>
                  <div className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 hover:dark:bg-gray-700 transition-colors duration-200">
                    <p className="text-text dark:text-text-dark">{category}</p>
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
