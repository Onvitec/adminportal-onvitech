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
  // LogOutIcon,
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DashboardIcon,
  AnalyticsIcon,
  DatabaseIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
} from "../../components/icons";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  onClick?: () => void;
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

  const handleMobileLogoClick = () => {
    if (isDesktop) {
      toggleSidebar();
    } else {
      setIsCollapsed(true);
    }
  };

  // logout
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully!");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error signing out");
      console.error("Error signing out:", error);
    }
  };

  const navGroups: NavGroup[] = [
    {
      title: "ANALYSIS",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <DashboardIcon className="h-5 w-5" />,
        },
        // {
        //   title: "Analytics",
        //   href: "/analytics",
        //   icon: <AnalyticsIcon className="h-5 w-5" />,
        // },
      ],
    },
    {
      title: "DATA MANAGEMENT",
      items: [
        {
          title: "Session Maker",
          href: "/sessions",
          icon: <DatabaseIcon className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "ADMINISTRATION",
      items: [
        {
          title: "User Management",
          href: "/user-management",
          icon: <UsersIcon className="h-5 w-5" />,
        },
        {
          title: "Settings",
          href: "/settings",
          icon: <SettingsIcon className="h-5 w-5" />,
        },
        {
          title: "Sign Out",
          href: "#",
          icon: <LogOutIcon className="h-5 w-5" />,
          onClick: handleSignOut,
        },
      ],
    },
  ];

  // Function to check if a nav item is active
  const isActive = (href: string) => {
    // Make dashboard active when exactly on /dashboard
    if (href === "/dashboard") {
      return pathname === href;
    }
    // For other routes, check if pathname starts with href
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "flex h-screen  flex-col border-r border-border bg-[#1C2534] transition-all duration-300 ease-in-out dark:bg-card",
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
                onClick={handleMobileLogoClick}
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
              <div className="mb-2 text-[#A5ACBA] px-6  font-semibold text-[14px] uppercase tracking-wider">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => (
                <TooltipProvider key={itemIndex} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {item.onClick ? (
                        <button
                          onClick={item.onClick}
                          className={cn(
                            "group w-full text-left flex items-center py-2.5 text-[15px] font-semibold transition-colors border-l-2",
                            isCollapsed
                              ? "justify-center px-0"
                              : "justify-start pl-6 pr-6",
                            "text-[#A5ACBA] border-l-transparent hover:bg-[#333B48] hover:text-white"
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
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center py-2.5 text-[15px] font-semibold transition-colors border-l-2",
                            isCollapsed
                              ? "justify-center px-0"
                              : "justify-start pl-6 pr-6",
                            isActive(item.href)
                              ? "bg-[#333B48] text-white border-l-[#F9F9F9]"
                              : "text-[#A5ACBA] border-l-transparent hover:bg-[#333B48] hover:text-white"
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
                      )}
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
