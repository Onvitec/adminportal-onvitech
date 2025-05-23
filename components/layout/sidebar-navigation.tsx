"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Database,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useMediaQuery } from "../../hooks/use-media-query";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function SidebarNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!isDesktop) {
      setIsCollapsed(true);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop) {
      const storedState = localStorage.getItem("sidebarCollapsed");
      if (storedState) {
        setIsCollapsed(storedState === "true");
      }
    }
  }, [isDesktop]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (isDesktop) {
      localStorage.setItem("sidebarCollapsed", String(newState));
    }
  };

  // New function to handle mobile logo click
  const handleMobileLogoClick = () => {
    if (isDesktop) {
      toggleSidebar(); // Toggle on desktop
    } else {
      setIsCollapsed(true); // Always close on mobile
    }
  };

  const navGroups: NavGroup[] = [
    {
      title: "ANALYSIS",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          title: "Analytics",
          href: "/analytics",
          icon: <BarChart className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "DATA MANAGEMENT",
      items: [
        {
          title: "Session Maker",
          href: "/session",
          icon: <Database className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "ADMINISTRATION",
      items: [
        {
          title: "User Management",
          href: "/users",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Settings",
          href: "/settings",
          icon: <Settings className="h-5 w-5" />,
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-border bg-[#1C2534] transition-all duration-300 ease-in-out dark:bg-card",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        !isDesktop ? "fixed top-0 left-0 z-50" : "relative"
      )}
    >
      {/* Header Section */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center justify-between w-full gap-2">
          {!isCollapsed ? (
            <>
              <div className="flex items-center min-w-[140px]">
                <Image
                  src={"/icons/logo.png"}
                  height={40}
                  width={140}
                  alt="logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
              {isDesktop && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white text-black p-1.5 h-6 w-6 ml-auto"
                  onClick={toggleSidebar}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={handleMobileLogoClick} // Changed to new handler
                className="rounded-full hover:opacity-80 transition"
              >
                <Image
                  src="/icons/mobilelogo.png"
                  alt="icon"
                  width={55}
                  height={27}
                  className="object-contain"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4 last:mb-0">
            {!isCollapsed && (
              <div className="mb-2 text-[#A5ACBA] px-6 text-xs font-semibold text-[14px] uppercase tracking-wider">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => (
                <TooltipProvider key={itemIndex} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center py-2.5 text-sm font-medium transition-colors border-l-2",
                          isCollapsed
                            ? "justify-center px-0"
                            : "justify-start pl-6 pr-6",
                          pathname === item.href
                            ? "bg-[#333B48] text-white border-l-[#F9F9F9]"
                            : "text-[#A5ACBA] border-l-transparent hover:bg-gray-50 hover:bg-opacity-10"
                        )}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0",
                            !isCollapsed && "mr-3"
                          )}
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="z-[100]">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}