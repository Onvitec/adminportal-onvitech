import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const solutionCategories = [
  { id: 1, name: "Form" },
  { id: 2, name: "Confirmation Email" },
  { id: 3, name: "Link" },
  { id: 4, name: "Video Solution" },
];
