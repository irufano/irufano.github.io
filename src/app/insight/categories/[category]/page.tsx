import Layout, { LayoutType } from "@/components/Core/Layout";
import { getAllCategories, getAllPostsByCategory, categoryToSlug, getCategoryBySlug } from "@/utils/posts";
import CategoryPostsList from "./CategoryPostsList";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({ category: categoryToSlug(category) }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const posts = getAllPostsByCategory(category);

  return (
    <Layout type={LayoutType.INSIGHT}>
      <Suspense>
        <CategoryPostsList posts={posts} category={category} />
      </Suspense>
    </Layout>
  );
}
