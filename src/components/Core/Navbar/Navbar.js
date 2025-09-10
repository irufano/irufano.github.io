import IrufanoDevLogo from "@/components/Logo/IrufanoDevLogo";
import Link from "next/link";
import { useEffect, useState } from "react";
import SearchButton from "../../Button/SearchButton";
import ThemeToggle from "../../Button/ThemeToggle";
import { LayoutType } from "../Layout";

export default function Navbar({ solid = false, type = LayoutType.DEV }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const activeMenuStyle =
    "mr-2 text-primary dark:text-primary hover:text-text dark:hover:text-text-dark";
  const defaultMenuStyle =
    "mr-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark";

  if (type === LayoutType.INSIGHT) {
    useEffect(() => {
      const controlNavbar = () => {
        if (typeof window !== "undefined") {
          if (window.scrollY > lastScrollY) {
            // Scrolling down
            setShowNavbar(false);
          } else {
            // Scrolling up
            setShowNavbar(true);
          }
          setLastScrollY(window.scrollY);
        }
      };

      if (typeof window !== "undefined") {
        window.addEventListener("scroll", controlNavbar);

        return () => {
          window.removeEventListener("scroll", controlNavbar);
        };
      }
    }, [lastScrollY]);
  } else {
    // dev
    useEffect(() => {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 0);
      };

      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);
  }

  const devNavbar = () => {
    return (
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 
      ${
        solid
          ? "bg-surface dark:bg-surface-dark shadow-sm"
          : isScrolled
          ? "bg-surface/20 backdrop-blur-md dark:bg-surface-dark/30 shadow-sm"
          : isOpen
          ? "bg-surface dark:bg-surface-dark"
          : "bg-transparent dark:bg-transparent"
      }
    `}
      >
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text dark:text-white focus:outline-none"
            >
              {isOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M18 6 L6 18" />
                  <path d="M6 6 L18 18" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="180.276 2174.957 627.448 490.086"
                  width="627.448pt"
                  height="490.086pt"
                  className="w-6 h-6"
                >
                  <path
                    d=" M 219.276 2213.957 L 768.724 2213.957 M 219.276 2420 L 768.724 2420 M 219.276 2626.043 L 348 2626.043 L 504 2626.043 L 528 2626.043"
                    fill="none"
                    strokeWidth="56"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="text-xl font-bold">
            <Link href="/">
              <IrufanoDevLogo />
            </Link>
          </div>
          <div className="hidden md:flex space-x-4 items-center text-md font-medium">
            <Link href="/">
              <h3
                className={` 
                ${type === LayoutType.DEV ? activeMenuStyle : defaultMenuStyle}
                `}
              >
                Home
              </h3>
            </Link>
            <Link href="/tools">
              <h3
                className={`
                 ${
                   type === LayoutType.TOOLS
                     ? activeMenuStyle
                     : defaultMenuStyle
                 }
                `}
              >
                Tools
              </h3>
            </Link>
            <Link href="/insight">
              <h3
                className={`
                 ${
                   type === LayoutType.INSIGHT
                     ? activeMenuStyle
                     : defaultMenuStyle
                 }
                `}
              >
                Insight
              </h3>
            </Link>
            <ThemeToggle />
          </div>
          <div className="md:hidden flex items-center">
            <ThemeToggle />
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden my-2 space-y-4 justify-center items-start text-center text-md font-medium">
            <Link href="/">
              <h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">
                Home
              </h3>
            </Link>
            <Link href="/tools">
              <h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">
                Tools
              </h3>
            </Link>
            <Link href="/insight">
              <h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">
                Insight
              </h3>
            </Link>
          </div>
        )}
      </nav>
    );
  };

  const insightNavbar = () => {
    if (showNavbar) {
      return (
        <nav
          className={`fixed w-full bg-surface dark:bg-surface-dark text-white z-50 transition-transform duration-30 bg-surface/20 backdrop-blur-md dark:bg-surface-dark/30 shadow-sm ${
            showNavbar ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="container mx-auto p-4 flex justify-between items-center">
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-text dark:text-white focus:outline-none"
              >
                {isOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M18 6 L6 18" />
                    <path d="M6 6 L18 18" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="180.276 2174.957 627.448 490.086"
                    width="627.448pt"
                    height="490.086pt"
                    className="w-6 h-6"
                  >
                    <path
                      d=" M 219.276 2213.957 L 768.724 2213.957 M 219.276 2420 L 768.724 2420 M 219.276 2626.043 L 348 2626.043 L 504 2626.043 L 528 2626.043"
                      fill="none"
                      strokeWidth="56"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-xl font-bold">
              <Link href="/">
                <IrufanoDevLogo />
              </Link>
            </div>
            <div className="hidden md:flex space-x-4 items-center text-md font-medium">
              <Link href="/">
                <h3
                  className={`
                   ${
                     type === LayoutType.DEV
                       ? activeMenuStyle
                       : defaultMenuStyle
                   }
                  `}
                >
                  Home
                </h3>
              </Link>
              <Link href="/tools">
                <h3
                  className={`
                   ${
                     type === LayoutType.TOOLS
                       ? activeMenuStyle
                       : defaultMenuStyle
                   }
                  `}
                >
                  Tools
                </h3>
              </Link>
              <Link href="/insight">
                <h3
                  className={`
                   ${
                     type === LayoutType.INSIGHT
                       ? activeMenuStyle
                       : defaultMenuStyle
                   }
                  `}
                >
                  Insight
                </h3>
              </Link>
              <SearchButton />
              <ThemeToggle />
            </div>
            <div className="md:hidden flex items-center">
              <ThemeToggle />
            </div>
          </div>
          {isOpen && (
            <div className="md:hidden my-2 space-y-4 justify-center items-start text-center text-md font-medium">
              <div className="flex w-full justify-center items-center my-3">
                <SearchButton hasText={true} />
              </div>
              <Link href="/">
                <h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">
                  Home
                </h3>
              </Link>
              <Link href="/tools">
                <h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">
                  Tools
                </h3>
              </Link>
              <Link href="/insight">
                <h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">
                  Insight
                </h3>
              </Link>
            </div>
          )}
        </nav>
      );
    } else {
      return (
        <nav
          className={`fixed top-0 right-0 w-auto bg-surface dark:bg-surface-dark text-white z-50 transition-transform duration-30 shadow-md rounded-bl-2xl bg-surface/20 backdrop-blur-md dark:bg-surface-dark/30`}
        >
          <div className="container mx-auto p-4 flex justify-between items-center">
            <div className="hidden md:block space-y-4 items-center text-md font-medium">
              <SearchButton />
              <ThemeToggle />
            </div>
            <div className="block md:hidden space-y-4 items-center text-md font-medium">
              <ThemeToggle />
            </div>
          </div>
        </nav>
      );
    }
  };

  switch (type) {
    case LayoutType.DEV:
      return devNavbar();

    case LayoutType.INSIGHT:
      return insightNavbar();

    default:
      return devNavbar();
  }
}
