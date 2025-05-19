"use client";

import { useState, useEffect } from "react";
import { SidebarNavigation } from "./sidebar-navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function CustomLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem("sidebarCollapsed");
    if (storedState) setIsCollapsed(storedState === "true");

    const handleStorageChange = () => {
      const currentState = localStorage.getItem("sidebarCollapsed");
      setIsCollapsed(currentState === "true");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNavigation />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center  bg-background px-4 lg:px-6">
          <div
            className={cn(
              "flex w-full items-center justify-between transition-all duration-300 ease-in-out",
              isCollapsed ? "ml-[10px]" : "ml-[220px]"
            )}
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-md bg-background pl-8 md:w-[300px] lg:w-[400px] border-none"
              />
            </div>

            {/* Profile */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback>BF</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Brian Ford</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="ml-2 hidden sm:block">
                <p className="text-sm font-medium">Brian Ford</p>
                <p className="text-xs text-muted-foreground">
                  brianford@gmail.com
                </p>
              </div>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "flex-1 overflow-y-auto  transition-all duration-300 ease-in-out bg-[##F2F7FC]",
            isCollapsed ? "ml-[70px]" : "ml-[220px]"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
