import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import Script from "next/script";
import "../styles/globals.css";
import "highlight.js/styles/tomorrow-night-blue.min.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ubuntu",
  weight: ["300", "400", "500", "700"],
});

const analyticsId = "G-787PK2XJ06";

export const metadata: Metadata = {
  title: "Irufano Dev - Developer Portal",
  description:
    "A tech docs, insights about the software development and also provides several tools for anyone who need it",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://irufano.github.io",
    siteName: "irufano Dev",
    title: "Irufano Dev - Developer Portal",
    description:
      "A tech docs, insights about the software development and also provides several tools for anyone who need it",
    images: [
      {
        url: "https://irufano.github.io/images/insight-default.svg",
        width: 800,
        height: 600,
        alt: "Irufano Insight",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${analyticsId}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${ubuntu.variable} font-ubuntu`}>
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}

function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              if (localStorage.getItem('theme') === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}
