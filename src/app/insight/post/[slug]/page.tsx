import Layout, { LayoutType } from "@/components/Core/Layout";
import { getAllPosts, getPostBySlug } from "@/utils/posts";
import PostContent from "./PostContent";
import type { Metadata } from "next";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      url: `https://irufano.github.io/insight/post/${slug}`,
      siteName: "Irufano Insight",
      images: post.meta.image
        ? [
            {
              url: post.meta.image,
              width: 800,
              height: 600,
              alt: post.meta.title,
            },
          ]
        : [],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const pathname = `/insight/post/${slug}`;

  return (
    <Layout type={LayoutType.INSIGHT}>
      <PostContent post={post} pathname={pathname} />
    </Layout>
  );
}
