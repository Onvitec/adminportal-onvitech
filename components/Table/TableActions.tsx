"use client"

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionIcon } from "../icons";

interface Action {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: "default" | "destructive" | "outline";
}

interface TableActionsProps {
  actions: Action[];
  isVisible: boolean;
}

export default function TableActions({ actions, isVisible }: TableActionsProps) {
  if (!isVisible) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <ActionIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.action}
            className={action.variant === "destructive" ? "text-red-600" : ""}
          >
            <div className="flex items-center gap-2">
              {action.icon}
              {action.label}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}