"use client";

import IrufanoDevLogo from "@/components/Logo/IrufanoDevLogo";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SearchButton from "../../Button/SearchButton";
import ThemeToggle from "../../Button/ThemeToggle";
import { LayoutType } from "../Layout";

interface NavbarProps {
  solid?: boolean;
  type?: string;
}

export default function Navbar({ solid = false, type = LayoutType.DEV }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const activeMenuStyle =
    "mr-2 text-primary dark:text-primary hover:text-text dark:hover:text-text-dark transition-colors duration-200";
  const defaultMenuStyle =
    "mr-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark transition-colors duration-200";

  useEffect(() => {
    if (type === LayoutType.INSIGHT) {
      const controlNavbar = () => {
        if (typeof window !== "undefined") {
          if (window.scrollY > lastScrollY) {
            setShowNavbar(false);
          } else {
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
    } else {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 0);
      };

      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [lastScrollY, type]);

  const menuButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "text-text dark:text-white focus:outline-none",
        "hover:text-primary transition-colors duration-200"
      )}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Menu className="w-6 h-6" />
      )}
    </button>
  );

  const desktopMenu = (
    <div className="hidden md:flex space-x-4 items-center text-md font-medium">
      <Link href="/"><h3 className={type === LayoutType.DEV ? activeMenuStyle : defaultMenuStyle}>Home</h3></Link>
      <Link href="/tools"><h3 className={type === LayoutType.TOOLS ? activeMenuStyle : defaultMenuStyle}>Tools</h3></Link>
      <Link href="/insight"><h3 className={type === LayoutType.INSIGHT ? activeMenuStyle : defaultMenuStyle}>Insight</h3></Link>
      {type === LayoutType.INSIGHT && <SearchButton />}
      <ThemeToggle />
    </div>
  );

  const mobileMenu = isOpen && (
    <div className="md:hidden my-2 space-y-4 justify-center items-start text-center text-md font-medium">
      {type === LayoutType.INSIGHT && (
        <div className="flex w-full justify-center items-center my-3">
          <SearchButton hasText={true} />
        </div>
      )}
      <Link href="/"><h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">Home</h3></Link>
      <Link href="/tools"><h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">Tools</h3></Link>
      <Link href="/insight"><h3 className="block py-2 text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-dark">Insight</h3></Link>
    </div>
  );

  if (type === LayoutType.INSIGHT) {
    if (showNavbar) {
      return (
        <nav className={`fixed w-full bg-surface dark:bg-surface-dark text-white z-50 transition-transform duration-30 bg-surface/20 backdrop-blur-md dark:bg-surface-dark/30 shadow-sm ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="container mx-auto p-4 flex justify-between items-center">
            <div className="md:hidden flex items-center">{menuButton}</div>
            <div className="text-xl font-bold"><Link href="/"><IrufanoDevLogo /></Link></div>
            {desktopMenu}
            <div className="md:hidden flex items-center"><ThemeToggle /></div>
          </div>
          {mobileMenu}
        </nav>
      );
    } else {
      return (
        <nav className="fixed top-0 right-0 w-auto bg-surface dark:bg-surface-dark text-white z-50 transition-transform duration-30 shadow-md rounded-bl-2xl bg-surface/20 backdrop-blur-md dark:bg-surface-dark/30">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <div className="hidden md:block space-y-4 items-center text-md font-medium">
              <SearchButton /><ThemeToggle />
            </div>
            <div className="block md:hidden space-y-4 items-center text-md font-medium">
              <ThemeToggle />
            </div>
          </div>
        </nav>
      );
    }
  }

  // DEV / default navbar
  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-50 transition-colors duration-300",
      solid ? "bg-surface dark:bg-surface-dark shadow-sm"
        : isScrolled ? "bg-surface/20 backdrop-blur-md dark:bg-surface-dark/30 shadow-sm"
        : isOpen ? "bg-surface dark:bg-surface-dark"
        : "bg-transparent dark:bg-transparent"
    )}>
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="md:hidden flex items-center">{menuButton}</div>
        <div className="text-xl font-bold"><Link href="/"><IrufanoDevLogo /></Link></div>
        {desktopMenu}
        <div className="md:hidden flex items-center"><ThemeToggle /></div>
      </div>
      {mobileMenu}
    </nav>
  );
}
