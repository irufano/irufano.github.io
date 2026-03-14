"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpansionTileProps {
  title: string;
  children: ReactNode;
}

const ExpansionTile = ({ title, children }: ExpansionTileProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={cn("shadow-sm rounded-md border border-gray-200 dark:border-gray-700", "transition-colors duration-200")}>
      <div
        className={cn("flex justify-between items-center px-4 py-2 cursor-pointer", "hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md")}
        onClick={toggleOpen}
      >
        <div className="text-base font-medium text-gray-500 dark:text-gray-400">{title}</div>
        <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isOpen && "rotate-180")} />
      </div>
      {isOpen && <div className="p-4 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
};

export default ExpansionTile;
