"use client";

import { Shield, Target, Calendar, Box, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  target: Target,
  calendar: Calendar,
  box: Box,
  tool: Wrench,
};

interface ToolCardProps {
  title: string;
  subTitle: string;
  icon?: string;
  onClicked?: () => void;
  bg?: string;
  hover?: string;
}

const ToolCard = ({
  title,
  subTitle,
  icon = "tool",
  onClicked = () => {},
  bg = "bg-surface dark:bg-surface-dark",
  hover = "hover:bg-gray-50 hover:dark:bg-gray-800",
}: ToolCardProps) => {
  const IconComponent = iconMap[icon] || Wrench;
  return (
    <div
      className={cn("cursor-pointer rounded-lg shadow-md p-6 transition-all duration-200", bg, hover)}
      onClick={onClicked}
    >
      <div className="inline-block bg-primary rounded-lg shadow-md p-2 ">
        <IconComponent className="text-white" strokeWidth={1.5} size={24} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
        {title}
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">{subTitle}</p>
    </div>
  );
};

export default ToolCard;
