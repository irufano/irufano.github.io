import Layout, { LayoutType } from "@/components/Core/Layout";
import { getPosts, getAllCategories } from "@/utils/posts";
import type { Metadata } from "next";
import { Suspense } from "react";
import InsightContent from "./InsightContent";

export const metadata: Metadata = {
  title: "Irufano Insight - Tech Knowledge Docs",
  description:
    "Insights, ideas, stories, tutorials and technical documentations about technology, software development and other IT matters.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://irufano.github.io/insight",
    siteName: "Irufano Insight",
    title: "Irufano Insight",
    description:
      "Insights, ideas, stories, tutorials and technical documentations about technology, software development and other IT matters.",
    images: [
      {
        url: "https://irufano.github.io/images/insight-default.svg",
        width: 800,
        height: 600,
        alt: "Irufano Insight",
      },
    ],
  },
};

export default function Insights() {
  const { paginatedPosts: posts } = getPosts(1, Infinity);
  const categories = getAllCategories();

  return (
    <Layout type={LayoutType.INSIGHT}>
      <Suspense>
        <InsightContent posts={posts} categories={categories} />
      </Suspense>
    </Layout>
  );
}
