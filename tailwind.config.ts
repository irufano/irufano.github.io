import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      colors: {
        primary: {
          light: "#0CD79A",
          DEFAULT: "#0CD79A",
          dark: "#0CD79A",
        },
        secondary: {
          light: "#46ECBA",
          DEFAULT: "#46ECBA",
          dark: "#46ECBA",
        },
        accent: {
          light: "#93C5FD",
          DEFAULT: "#93C5FD",
          dark: "#4177EF",
        },
        surface: {
          light: "#FFFFFF",
          DEFAULT: "#FFFFFF",
          dark: "#212426",
        },
        surfaceSection: {
          light: "#D9F2F6",
          DEFAULT: "#D9F2F6",
          dark: "#16373B",
        },
        background: {
          light: "#FAFAFA",
          DEFAULT: "#FAFAFA",
          dark: "#161819",
        },
        text: {
          light: "#374151",
          DEFAULT: "#374151",
          dark: "#E3E4E5",
          heading: "#ECEDEE",
        },
        expansion: {
          light: "#EDF1F6",
          DEFAULT: "#EDF1F6",
          dark: "#494B4D",
        },
      },
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            color: theme("colors.text.light"),
            a: {
              color: theme("colors.emerald.500"),
              "&:hover": {
                color: theme("colors.emerald.800"),
              },
            },
            h1: { color: theme("colors.text.light") },
            h2: { color: theme("colors.text.light") },
            h3: { color: theme("colors.text.light") },
            h4: { color: theme("colors.text.light") },
            h5: {
              color: theme("colors.text.light"),
              fontWeight: "600",
              fontSize: "1.1rem",
            },
            blockquote: {
              borderLeftColor: theme("colors.text.light"),
              color: theme("colors.text.light"),
            },
          },
        },
        dark: {
          css: {
            color: theme("colors.text.dark"),
            a: {
              color: theme("colors.emerald.400"),
              "&:hover": {
                color: theme("colors.emerald.600"),
              },
            },
            h1: { color: theme("colors.text.heading") },
            h2: { color: theme("colors.text.heading") },
            h3: { color: theme("colors.text.heading") },
            h4: { color: theme("colors.text.heading") },
            h5: {
              color: theme("colors.text.heading"),
              fontWeight: "600",
              fontSize: "1.1rem",
            },
            blockquote: {
              borderLeftColor: theme("colors.text.dark"),
              color: theme("colors.text.dark"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};

export default config;
