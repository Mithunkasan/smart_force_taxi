"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Truck,
  Users,
  CalendarCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useTranslation } from "./language-provider";

interface SidebarProps {
  role: "SUPER_ADMIN" | "TRANSPORT_MANAGER" | "DRIVER";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();
  const { t } = useTranslation();

  React.useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  const logoSrc = theme === "dark" ? "/logo.png" : "/logo1.png";

  const adminLinks = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/vehicles", label: t("vehicles"), icon: Truck },
    { href: "/admin/drivers", label: t("drivers"), icon: Users },
    { href: "/admin/weekly-log", label: t("weekly_log"), icon: CalendarCheck },
  ];

  const driverLinks = [
    { href: "/driver", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/driver/available-vehicles", label: t("vehicles"), icon: Truck },
    { href: "/driver/weekly-log", label: t("weekly_log"), icon: CalendarCheck },
  ];

  const links = role === "DRIVER" ? driverLinks : adminLinks;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-300 md:static md:z-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className={cn("flex items-center gap-3 transition-opacity", collapsed && "md:opacity-0")}>
            <img src={logoSrc} alt="Smart Force Taxi Logo" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Smart Force <span className="text-primary">Taxi</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-8 w-8 rounded-full border border-border bg-background"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 hover:glow-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn("transition-opacity duration-200", collapsed && "md:hidden")}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all duration-200 cursor-pointer"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn("transition-opacity", collapsed && "md:hidden")}>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
