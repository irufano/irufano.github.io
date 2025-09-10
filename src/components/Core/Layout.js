import { ubuntu } from "@/utils/font";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";

export const LayoutType = Object.freeze({
  DEV: "dev",
  TOOLS: "tools",
  INSIGHT: "insight",
});

export default function Layout({ children, type = LayoutType.DEV }) {
  return (
    <div className={`${ubuntu} font-ubuntu flex flex-col min-h-screen`}>
      <Navbar type={type} />
      <main className="font-ubuntu flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
