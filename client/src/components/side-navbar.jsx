"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, FolderKanban } from "lucide-react";

import { LayoutDashboard, Package, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    title: "Category Manage",
    href: "/dashboard/category-manage",
    icon: FolderKanban,
  },
];

export function Sidenav() {
  const pathname = usePathname();

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-40 shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 border-r">
          <MobileNav />
        </SheetContent>
      </Sheet>
      <nav className="hidden md:block fixed top-0 left-0 h-full w-60 border-r bg-background">
        <ScrollArea className="h-full py-6 pl-4 pr-2">
          <div className="mb-4 px-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[#036280]">
              Xcel B2B
            </h2>
          </div>
          <SidenavItems />
        </ScrollArea>
        <div className="absolute bottom-0 w-full p-4">
          <LogOutButton />
        </div>
      </nav>
    </>
  );

  function MobileNav() {
    return (
      <ScrollArea className="h-full py-6 pl-4 pr-2">
        <div className="mb-4 px-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#036280]">
            Xcel B2B
          </h2>
        </div>
        <SidenavItems />
        <div className="absolute bottom-2 w-full -translate-x-1/2 left-1/2 px-3">
          <LogOutButton />
        </div>
      </ScrollArea>
    );
  }

  function SidenavItems() {
    return (
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 my-1 text-base  hover:bg-gray-200 hover:text-gray-200-foreground",
                pathname === item.href ? "bg-gray-200" : "transparent"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </span>
          </Link>
        ))}
      </div>
    );
  }
}

function LogOutButton() {
  const { logout, checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const logOutApiAction = async () => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/logout`
      );
      if (res.status === 200) {
        toast({
          title: "Logout successful",
          description: "You have been logged out successfully",
          status: "success",
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Logout API action failed:", error);
      toast({
        title: "Logout failed",
        description: "Failed to logout",
        status: "error",
      });
    }
  };

  const handleLogout = async () => {
    await logOutApiAction();
    await logout();
    checkAuth();
    router.push("/");
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="w-full flex items-center justify-center border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
