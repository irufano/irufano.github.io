import Layout from "@/components/Core/Layout";
import Greeting from "@/components/Home/Greeting";
import HomeInsightsCard from "@/components/Home/HomeInsightCard";
import ToolCard from "@/components/Home/ToolCard";
import { getPosts } from "@/utils/posts";
import Image from "next/image";
import Logo from "../assets/irufano-square-logo.svg";
import LogoAnimation from "@/components/Animation/LogoAnimation";
import DiagonalAnimation from "@/components/Animation/DiagonalAnimation";

export async function getStaticProps({ params }) {
  const page = 1; // Start with the first page
  const postsPerPage = 5;
  const { paginatedPosts } = getPosts(page, postsPerPage);

  return {
    props: {
      posts: paginatedPosts,
    },
  };
}

export default function Home({ posts }) {
  return (
    <Layout>
      <div className="relative w-full h-auto bg-emerald-50 dark:bg-background-dark">
        {/* First Image */}
        <div className="absolute top-[5%] md:top-[6%] -left-[15%] md:-left-[5%]">
          <div className="relative">
            <Image
              src={Logo}
              alt="-"
              className="w-40 md:w-72 2xl:w-[20rem] h-auto"
              priority={true}
            />
          </div>
        </div>

        <div className="absolute left-[60%] md:left-[40%]">
          <div className="relative">
            <DiagonalAnimation />
          </div>
        </div>

        {/* Animation Image */}
        {/* <div className="absolute top-[15%] right-[5%]">
          <div className="relative">
            <LogoAnimation />
          </div>
        </div> */}

        {/* Second Image */}
        <div className="absolute top-[15%] right-[5%]">
          <div className="relative" style={{ filter: "blur(100px)" }}>
            <Image
              src={Logo}
              alt="-"
              className="w-20 md:w-60 h-auto"
              priority={true}
            />
          </div>
        </div>

        {/* Third Image */}
        <div className="absolute top-[20%] right-[40%]">
          <div className="relative" style={{ filter: "blur(100px)" }}>
            <Image
              src={Logo}
              alt="-"
              className="w-25 md:w-80 h-auto"
              priority={true}
            />
          </div>
        </div>

        <div className=" relative flex items-center justify-center py-16 md:py-24">
          <div className="container mx-auto p-4">
            <div className="md:flex justify-center">
              <div className="inline-block md:hidden w-full">
                <Greeting />
              </div>

              <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-6 w-full mr-0 md:mr-6 mt-4 md:mt-0">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                      Developer Portal
                    </h2>
                  </div>
                  <p className="mt-3 text-gray-600 dark:text-gray-300">
                    A tech docs, insights about the software development and
                    also provides several tools for anyone who need it
                  </p>
                </div>
              </div>

              <div className="hidden md:inline-block max-w-full md:max-w-md w-full">
                <Greeting />
              </div>
            </div>

            {/* Tools */}
            <div className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ToolCard
                  title="AES Encryption"
                  subTitle="Encrypt and decrypt text"
                  icon="shield"
                  onClicked={() => {
                    alert("Coming soon");
                  }}
                />
                <ToolCard
                  title="Roulette"
                  subTitle="Digital spinner tool"
                  icon="target"
                  onClicked={() => {
                    alert("Coming soon");
                  }}
                />
                <ToolCard
                  title="Calendar"
                  subTitle="Holiday event viewer"
                  icon="calendar"
                  onClicked={() => {
                    alert("Coming soon");
                  }}
                />
                <ToolCard
                  title="See more tools"
                  subTitle="→"
                  icon="box"
                  bg="bg-teal-100 dark:bg-teal-900"
                  hover="hover:bg-primary/50 hover:dark:bg-teal-950"
                  onClicked={() => {
                    alert("Coming soon");
                  }}
                />
              </div>
            </div>

            {/* Insight */}
            <div className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <HomeInsightsCard posts={posts} />
                </div>

                <div
                  className="bg-blue-200/40 dark:bg-blue-700/30 backdrop-blur-md rounded-lg shadow-lg p-6 w-full mr-0 md:mr-6 mt-4 md:mt-0 flex items-center bg-cover bg-center"
                  style={{ backgroundImage: `url('/promo-bg.svg')` }}
                >
                  <div className="w-full text-center justify-center">
                    <h2 className="text-4xl font-semibold text-white">
                      Free space
                    </h2>
                    <h2 className="text-2xl font-semibold text-white">
                      for sponsor
                    </h2>
                    <div className="justify-center mx-auto w-ful w-6 h-auto mt-4">
                      <Image
                        src={Logo}
                        alt="-"
                        className=" w-ful w-6 h-auto"
                        priority={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
