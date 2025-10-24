"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-solid border-current border-r-transparent",
          sizeClasses[size],
          "motion-reduce:animate-[spin_1.5s_linear_infinite]"
        )}
        style={{ 
          animationTimingFunction: "cubic-bezier(0.8, 0, 0.2, 1)",
          borderWidth: "2px"
        }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

// Enhanced Saving Loader with progress indication
export function SavingLoader({ 
  progress, 
  message = "Saving changes..." 
}: { 
  progress?: number;
  message?: string;
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border p-6 max-w-sm w-full mx-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-100"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            {progress !== undefined && (
              <div className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">
                  {progress}%
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{message}</p>
            {progress !== undefined && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline saving indicator for buttons
export function ButtonLoader({ text = "Saving..." }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>{text}</span>
    </div>
  );
}