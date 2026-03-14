"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SearchButtonProps {
  hasText?: boolean;
}

const SearchButton = ({ hasText = false }: SearchButtonProps) => {
  const router = useRouter();
  const searchOnClicked = () => {
    router.push(`/insight/search`);
  };

  return (
    <button
      onClick={searchOnClicked}
      className={cn(
        "flex items-center justify-center p-2 rounded-full",
        "bg-gray-100 dark:bg-gray-800",
        "hover:bg-gray-200 dark:hover:bg-gray-700",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-secondary/50",
        hasText && "px-4"
      )}
      aria-label="Search"
    >
      <Search className="w-5 h-5 text-secondary" />
      {hasText ? (
        <span className="ml-2 text-md text-text dark:text-text-dark">
          Search
        </span>
      ) : (
        <></>
      )}
    </button>
  );
};

export default SearchButton;
