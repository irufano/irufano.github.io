import Layout from "@/components/Core/Layout";
import IdulFitriContent from "@/components/IdulFitri/IdulFitriContent";
import { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Selamat Idul Fitri 1447H - Irufano",
  description:
    "Irufano dan keluarga mengucapkan Selamat Hari Raya Idul Fitri 1447H, Mohon Maaf Lahir dan Batin",
};

export default function IdulFitriPage() {
  return (
    <Layout>
      <div className={pixelFont.variable}>
        <IdulFitriContent />
      </div>
    </Layout>
  );
}
