import Layout, { LayoutType } from "@/components/Core/Layout";
import { getAllTags, getAllPostsByTag } from "@/utils/posts";
import TagPostsList from "./TagPostsList";
import { Suspense } from "react";

export function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = getAllPostsByTag(tag);

  return (
    <Layout type={LayoutType.INSIGHT}>
      <Suspense>
        <TagPostsList posts={posts} tag={tag} />
      </Suspense>
    </Layout>
  );
}
