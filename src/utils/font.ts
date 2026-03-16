import localFont from "next/font/local";

// Using local font to avoid Next.js "Failed to find font override values" warning.
// Google Sans Flex is available on Google Fonts under SIL Open Font License.
//
// next/font/google usage (if Next.js adds support for font metrics):
// import { Google_Sans_Flex } from "next/font/google";
// const fontInit = Google_Sans_Flex({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-google-sans-flex",
// });

const fontInit = localFont({
  src: [
    {
      path: "../assets/fonts/GoogleSansFlex-latin.woff2",
      style: "normal",
    },
    {
      path: "../assets/fonts/GoogleSansFlex-latin-ext.woff2",
      style: "normal",
    },
  ],
  variable: "--font-google-sans-flex",
  display: "swap",
});

export const defaultFont = fontInit.variable;
export const defaultFontInit = fontInit;
