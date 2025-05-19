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

  // Load collapsed state from localStorage
  useEffect(() => {
    const storedState = localStorage.getItem("sidebarCollapsed");
    if (storedState) {
      setIsCollapsed(storedState === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
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
          href: "/session-maker",
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
        isCollapsed ? "w-[70px]" : "w-[220px]"
      )}
    >
      <div className="flex h-14 items-center px-3 py-2">
        <div className="flex items-center justify-between w-full">
          {!isCollapsed ? (
            <>
              <Image
                src={"/icons/logo.png"}
                height={100}
                width={100}
                alt="logo"
              />
              <Button
                variant="ghost"
                size="icon"
                className="bg-white text-black p-1.5 h-8 w-8" // smaller button
                onClick={toggleSidebar}
              >
                <ChevronLeft className="h-4 w-4" /> {/* smaller icon */}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="bg-white text-black p-1.5 h-8 w-8" // consistent size
              onClick={toggleSidebar}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {!isCollapsed && (
              <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
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
                          "flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-gray-50 hover:bg-opacity-40",
                          pathname === item.href ? "" : "text-muted-foreground",
                          isCollapsed && "justify-center"
                        )}
                      >
                        {item.icon}
                        {!isCollapsed && (
                          <span className="ml-3">{item.title}</span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* <div className="mt-auto border-t p-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
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
              <div className="ml-2">
                <p className="text-sm font-medium">Brian Ford</p>
                <p className="text-xs text-muted-foreground">
                  brianford@gmail.com
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
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
          )}
        </div>
      </div> */}
    </div>
  );
}
