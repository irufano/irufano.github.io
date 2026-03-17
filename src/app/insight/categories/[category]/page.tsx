import Layout, { LayoutType } from "@/components/Core/Layout";
import { getAllCategories, getAllPostsByCategory } from "@/utils/posts";
import CategoryPostsList from "./CategoryPostsList";
import { Suspense } from "react";

export function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({ category: encodeURIComponent(category) }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const posts = getAllPostsByCategory(category);

  return (
    <Layout type={LayoutType.INSIGHT}>
      <Suspense>
        <CategoryPostsList posts={posts} category={category} />
      </Suspense>
    </Layout>
  );
}
