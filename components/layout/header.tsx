"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "./theme-provider";
import { useTranslation } from "@/components/layout/language-provider";
import { Bell, Moon, Sun, User as UserIcon, Check, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { signOut } from "next-auth/react";

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial notifications using a public api endpoint
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s for updates
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      {/* Welcome Message / Breadcrumb */}
      <div className="flex items-center gap-2.5 truncate pr-2">
        {user.role !== "DRIVER" && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 h-9 w-9 rounded-lg hover:bg-muted"
            onClick={handleToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </Button>
        )}
        <div className="truncate">
          <h1 className="text-xs sm:text-sm font-semibold text-muted-foreground truncate">
            <span className="hidden xs:inline">{t("welcome_back")}, </span>
            <span className="font-bold text-foreground">{user.name}</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{user.role.toLowerCase().replace("_", " ")}</p>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Language Switcher */}
        <div className="flex items-center gap-1 border-r border-border pr-2 sm:pr-3 text-[10px] sm:text-xs">
          <button
            onClick={() => setLanguage("en")}
            className={cn(
              "px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-bold rounded cursor-pointer transition-colors",
              language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
            )}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("fi")}
            className={cn(
              "px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-bold rounded cursor-pointer transition-colors",
              language === "fi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
            )}
          >
            FI
          </button>
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-card animate-bounce">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-border bg-card p-4 shadow-xl z-50 text-card-foreground">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start justify-between gap-2 p-2 rounded-lg text-xs transition-colors",
                        notif.isRead ? "bg-transparent" : "bg-muted"
                      )}
                    >
                      <div className="flex-1">
                        <p className={cn(notif.isRead ? "text-muted-foreground" : "text-foreground font-medium")}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 rounded-full hover:bg-primary/20 text-primary"
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Icon indicator */}
        <div className="flex items-center gap-2 border-l border-border pl-4 relative" ref={profileDropdownRef}>
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors focus:outline-none"
            aria-label="User Profile menu"
          >
            <UserIcon className="h-5 w-5" />
          </button>
          
          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-xl z-50 text-card-foreground">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
