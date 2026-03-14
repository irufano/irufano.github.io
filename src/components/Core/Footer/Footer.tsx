"use client";

import IrufanoLogo from "@/components/Logo/IrufanoLogo";
import Image from "next/image";
import Link from "next/link";
import Logo from "../../../assets/irufano-square-logo.svg";

const Footer = () => {
  const d = new Date();
  const year = d.getFullYear();
  return (
    <footer className="py-16 text-center bg-surface dark:bg-surface-dark w-full">
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between justify-center items-center space-y-1">
          <div>
            <Link href={"https://irufano.com"}>
              <IrufanoLogo />
            </Link>
          </div>
          <Image
            src={Logo}
            alt="-"
            className="hidden md:inline-block w-ful w-4 h-auto"
          />
          <div className="flex items-center ">
            <Link href={"/"}>
              <h3 className="text-sm text-gray-500">
                irufano.github.io{" "}
                <span className="font-light text-gray-400 dark:text-gray-600">
                  |
                </span>{" "}
                {year}
              </h3>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
