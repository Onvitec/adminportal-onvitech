// components/layout/dashboard-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { SidebarNavigation } from "./sidebar-navigation";
import { Search, Menu, ChevronDown } from "lucide-react";
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
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useSession } from "../session-provider";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user, signOut } = useSession();

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      setIsMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const initials = user?.username ? getInitials(user.username) : "U";

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarNavigation />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNavigation />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center bg-background px-4 lg:px-6 border-b">
          <div className="flex w-full items-center justify-between">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2"
              onClick={toggleMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              
            </div>

            {/* Profile */}
       
<div className="flex items-center ml-4">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className="flex items-center space-x-3 h-10 px-3 rounded-full focus:outline-none"
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder-avatar.jpg" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Username, Email, Chevron */}
        <div className="hidden sm:flex flex-col items-start justify-center">
          <p className="text-sm font-medium">{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">
      <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>



          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F2F7FC]">
          {children}
        </main>
      </div>
    </div>
  );
}