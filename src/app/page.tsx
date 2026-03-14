import Layout from "@/components/Core/Layout";
import Greeting from "@/components/Home/Greeting";
import HomeInsightsCard from "@/components/Home/HomeInsightCard";
import { getPosts } from "@/utils/posts";
import Image from "next/image";
import Logo from "../assets/irufano-square-logo.svg";
import LogoAnimation from "@/components/Animation/LogoAnimation";
import AnimatedOrbs from "@/components/Animation/AnimatedOrbs";
import HomeToolCards from "./HomeToolCards";

export default function Home() {
  const { paginatedPosts } = getPosts(1, 5);

  return (
    <Layout>
      <div className="relative w-full h-auto bg-emerald-50 dark:bg-background-dark">
        <AnimatedOrbs />

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
                    <div className="ml-4">
                      <LogoAnimation size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-gray-600 dark:text-gray-300">
                    A tech docs, insights about the software development and
                    also provides several tools for anyone who need it{" "}
                  </p>
                </div>
              </div>

              <div className="hidden md:inline-block max-w-full md:max-w-md w-full">
                <Greeting />
              </div>
            </div>

            {/* Tools */}
            <div className="mt-8">
              <HomeToolCards />
            </div>

            {/* Insight */}
            <div className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <HomeInsightsCard posts={paginatedPosts} />
                </div>

                {/* Mini Game */}
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
