import { getAllPosts, getPostBySlug } from "../../../utils/posts";
import { useEffect, useState } from "react";
import SEO from "@/components/Core/SEO";
import SEOInsight from "../../../../insight-next-seo.config";
import Layout, { LayoutType } from "@/components/Core/Layout";
import FeatherIcon from "feather-icons-react";
import { throttle } from "lodash";
import Link from "next/link";
import ExpansionTile from "@/components/Button/ExpansionTile";
import Comment from "@/components/Posts/Comment";
import { usePathname } from "next/navigation";
import Image from "next/image";

export async function getStaticPaths() {
  // Get all posts without pagination
  const posts = getAllPosts();
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: false, // You can also use 'blocking' or 'true' if you prefer.
  };
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  return { props: { post } };
}

export default function PostPage({ post }) {
  const pathname = usePathname();
  const title = post.meta?.title;
  const description = post.meta?.description;
  const date = post.meta?.date;
  const sections = post.sections ?? [];
  const content = post.content;
  const tags = post.meta?.tags ?? [];
  const readingTime = post.readingTime;
  const author = post.meta?.author;
  const thumbnail = post.meta?.image ?? null;

  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    // Function to calculate the dynamic offset based on the header height
    const calculateOffset = () => {
      const header = document.querySelector("header"); // Assuming your header has a <header> tag
      return header ? header.offsetHeight : 0; // Fallback to 0 if no header found
    };

    const handleScroll = throttle(() => {
      const offset = calculateOffset(); // Get the dynamic offset value
      const sectionOffsets = post.sections.map((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          return { id: section.id, offsetTop: element.offsetTop };
        }
        return { id: section.id, offsetTop: 0 };
      });

      const deviceHeight = window.innerHeight;
      const currentScrollPosition =
        window.scrollY + offset + deviceHeight * 0.25;

      const currentSection = sectionOffsets.find((section, index) => {
        const nextSection = sectionOffsets[index + 1];
        if (nextSection) {
          return (
            currentScrollPosition >= section.offsetTop &&
            currentScrollPosition < nextSection.offsetTop
          );
        }
        return currentScrollPosition >= section.offsetTop;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    }, 100);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [post.sections]);

  useEffect(() => {
    // handle copy code
    document.addEventListener("click", function (e) {
      if (e.target.closest(".copy-code")) {
        const button = e.target.closest(".copy-code");
        const codeId = button.getAttribute("data-code-id");
        const codeToCopy = document.getElementById(codeId).textContent;
        navigator.clipboard.writeText(codeToCopy).then(() => {
          button.innerHTML = button.innerHTML =
            '<svg class="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>';
          setTimeout(() => {
            button.innerHTML =
              '<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="Edit / Copy"><path id="Vector" d="M9 9V6.2002C9 5.08009 9 4.51962 9.21799 4.0918C9.40973 3.71547 9.71547 3.40973 10.0918 3.21799C10.5196 3 11.0801 3 12.2002 3H17.8002C18.9203 3 19.4801 3 19.9079 3.21799C20.2842 3.40973 20.5905 3.71547 20.7822 4.0918C21.0002 4.51962 21.0002 5.07967 21.0002 6.19978V11.7998C21.0002 12.9199 21.0002 13.48 20.7822 13.9078C20.5905 14.2841 20.2839 14.5905 19.9076 14.7822C19.4802 15 18.921 15 17.8031 15H15M9 9H6.2002C5.08009 9 4.51962 9 4.0918 9.21799C3.71547 9.40973 3.40973 9.71547 3.21799 10.0918C3 10.5196 3 11.0801 3 12.2002V17.8002C3 18.9203 3 19.4801 3.21799 19.9079C3.40973 20.2842 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H11.8036C12.9215 21 13.4805 21 13.9079 20.7822C14.2842 20.5905 14.5905 20.2839 14.7822 19.9076C15 19.4802 15 18.921 15 17.8031V15M9 9H11.8002C12.9203 9 13.4801 9 13.9079 9.21799C14.2842 9.40973 14.5905 9.71547 14.7822 10.0918C15 10.5192 15 11.079 15 12.1969L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></g></svg>';
          }, 2000);
        });
      }
    });
  }, []);

  return (
    <Layout type={LayoutType.INSIGHT}>
      <SEO
        title={title}
        description={description}
        url={SEOInsight.host + pathname}
        ogSiteName={SEOInsight.openGraph.site_name}
        images={[
          {
            url: thumbnail,
            width: 800,
            height: 600,
            alt: title,
            type: "image/png",
          },
        ]}
      />
      <div className="container mx-auto pt-20 md:pt-24 lg:flex lg:flex-row">
        {/* Article */}
        <div className="mx-auto p-4">
          <article className="prose prose-lg dark:prose-dark mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-text dark:text-text-heading">
              {title}
            </h1>
            <div className="flex space-x-4 mb-8">
              <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                <span>
                  <FeatherIcon
                    icon="calendar"
                    size={14}
                    className="mr-2 text-primary"
                  />
                </span>
                {date}
              </p>
              <p className="flex items-center mt-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                <span>
                  <FeatherIcon
                    icon="clock"
                    size={14}
                    className="mr-2 text-primary"
                  />
                </span>
                {readingTime}
              </p>
              <p className="flex items-center mt-2 text-xs md:text-sm">
                <span>
                  <FeatherIcon
                    icon="user"
                    size={14}
                    className="mr-2 text-primary"
                  />
                </span>
                <Link
                  href={"https://github.com/irufano"}
                  className="text-gray-700 dark:text-gray-300 no-underline font-normal hover:text-primary dark:hover:text-primary-dark"
                >
                  {author}
                </Link>
              </p>
            </div>
            {/* Display Section Links */}
            {sections.length > 0 && (
              <div className="block lg:hidden mb-8 lg:mb-0">
                <ExpansionTile title="Contents">
                  <div className="list-none">
                    {post.sections.map((heading) => (
                      <div
                        key={heading?.id}
                        className={`mb-1
                        ${
                          heading?.level === "3"
                            ? "ml-4"
                            : heading?.level === "4"
                            ? "ml-8"
                            : ""
                        }
                      `}
                      >
                        <a
                          href={`#${heading?.id}`}
                          className={`text-sm text-gray-500 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary no-underline `}
                        >
                          {heading?.text}
                        </a>
                      </div>
                    ))}
                  </div>{" "}
                </ExpansionTile>
              </div>
            )}

            {/* Thumbnail */}
            {thumbnail != null ? (
              <div className="mb-4">
                <Image
                  src={thumbnail}
                  alt={`${title} image`}
                  layout="fill"
                  className="!relative rounded-md shadow-sm mb-0"
                />
                <div className="flex justify-center mt-4 text-xs">
                  <p className="p-0 mt-0 ">
                    <i>
                      {" "}
                      Thumbnail{" "}
                      <a
                        className="no-underline"
                        rel="stylesheet"
                        href={thumbnail}
                      >
                        Credit
                      </a>
                    </i>
                  </p>
                </div>
              </div>
            ) : (
              <></>
            )}

            {/* Post Content */}
            <div
              className="prose prose-lg dark:prose-dark"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Tags */}
            <div className="my-8">
              <h4 className="text-lg font-semibold text-text dark:text-text-dark">
                Tags:
              </h4>
              <div className="list-none flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/insight/tags/${tag}`}
                    className="no-underline"
                  >
                    <div
                      key={tag}
                      className="text-sm bg-accent dark:bg-accent-dark text-white  px-2 py-1 rounded-md hover:bg-accent/70 dark:hover:bg-accent-dark/70"
                    >
                      {tag}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="my-8">
              <Comment />
            </div>
          </article>
        </div>

        {/* Section */}
        {sections.length > 0 && (
          <aside className="lg:w-1/4 sticky max-h-[80vh] overflow-auto top-24 mb-24 self-start hidden lg:block">
            <div className="p-4 border-l-2 border-l-gray-200 dark:border-l-gray-800">
              <nav className="mb-8">
                <h2 className="ml-6 text-base font-semibold mb-2 text-gray-500">
                  Contents
                </h2>
                <ul className="list-none ml-6">
                  {post.sections.map((heading) => (
                    <li
                      key={heading?.id}
                      className={`mb-[0.3rem]
                      ${
                        heading?.level === "3"
                          ? "ml-4"
                          : heading?.level === "4"
                          ? "ml-8"
                          : ""
                      }`}
                    >
                      <a
                        href={`#${heading?.id}`}
                        className={`text-xs text-gray-500 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary 
                        ${
                          activeSection === heading?.id
                            ? "text-primary dark:text-primary"
                            : ""
                        }
                        `}
                      >
                        {heading?.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        )}
      </div>
    </Layout>
  );
}
