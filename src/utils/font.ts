import { Ubuntu } from "next/font/google";

const ubuntuInit = Ubuntu({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ubuntu",
  weight: ["300", "400", "500", "700"],
});

export const ubuntu = ubuntuInit.variable;
export const ubuntuFont = ubuntuInit;
