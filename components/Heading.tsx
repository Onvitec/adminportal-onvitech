"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ children, className, ...props }) => {
  return (
    <h1
      className={cn("text-[28px] font-bold text-[#272D37] dark:text-white", className)}
      {...props}
    >
      {children}
    </h1>
  );
};

export default Heading;
