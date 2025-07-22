// components/Loader.tsx
import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Loader = ({ size = "md", className = "" }: LoaderProps) => {
  const sizeClasses = {
    sm: "h-6 w-6 border-t-2 border-b-2",
    md: "h-8 w-8 border-t-2 border-b-2",
    lg: "h-12 w-12 border-t-4 border-b-4",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-[#6195BA]`}
      ></div>
    </div>
  );
};