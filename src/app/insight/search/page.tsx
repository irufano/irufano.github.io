import Layout, { LayoutType } from "@/components/Core/Layout";
import { getPosts } from "@/utils/posts";
import SearchContent from "./SearchContent";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search - Irufano Insight",
  description: "Search Irufano Insight posts",
};

export default function SearchPage() {
  const posts = getPosts(1, Infinity).paginatedPosts;

  return (
    <Layout type={LayoutType.INSIGHT}>
      <Suspense>
        <SearchContent posts={posts} />
      </Suspense>
    </Layout>
  );
}
