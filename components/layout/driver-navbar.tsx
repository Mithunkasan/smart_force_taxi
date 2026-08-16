"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Truck, CalendarCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "@/components/layout/language-provider";
import { useDriverTab, DriverTab } from "@/components/drivers/driver-portal-context";

export function DriverNavbar() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useDriverTab();

  const navLinks = [
    { id: "dashboard" as const, href: "/driver", label: t("dashboard"), icon: LayoutDashboard },
    { id: "vehicles" as const, href: "/driver/available-vehicles", label: t("vehicles"), icon: Truck },
    { id: "weekly-log" as const, href: "/driver/weekly-log", label: t("weekly_log"), icon: CalendarCheck },
  ];

  return (
    <>
      {/* Desktop Top Sub-Navbar */}
      <nav className="hidden md:flex w-full items-center gap-2 border-b border-border/60 bg-card px-6 py-2">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(link.id);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border border-transparent hover:bg-muted/30 cursor-pointer",
                isActive 
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden flex fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border justify-around items-center z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(link.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all text-center gap-0.5 relative cursor-pointer",
                isActive 
                  ? "text-primary font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "scale-110 transition-transform")} />
              <span className="text-[9px] tracking-wider uppercase font-semibold leading-none truncate max-w-[70px]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

