"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LogIn, UserPlus, Shield, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import { useTranslation } from "@/components/layout/language-provider";
import { cn } from "@/utils/cn";

interface NavbarProps {
  session: any;
}

export default function Navbar({ session }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();

  const logoSrc = theme === "dark" ? "/logo.png" : "/logo1.png";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav_home"), href: "#home" },
    { name: t("nav_about"), href: "#about" },
    { name: t("nav_services"), href: "#services" },
    { name: t("nav_fleet"), href: "#fleet" },
    { name: t("nav_why_us"), href: "#why-choose-us" },
    { name: t("nav_contact"), href: "#contact" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80; // height of the sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/80 dark:bg-zinc-950/90 backdrop-blur-md shadow-lg border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center shrink-0">
            <Link href="#home" className="flex items-center gap-2 group">
              <img
                src={logoSrc}
                alt="Smart Force Taxi Logo"
                className="h-10 w-auto object-contain dark:brightness-110"
              />
              <span className="sr-only">Smart Force Taxi</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center justify-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3 py-2 text-sm font-medium text-zinc-300 hover:text-amber-500 rounded-md transition-colors relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
              </a>
            ))}
          </div>

          {/* Action Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-3 mr-2 text-[10px]">
              <button
                onClick={() => setLanguage("en")}
                className={cn(
                  "px-1.5 py-0.5 font-bold rounded cursor-pointer transition-colors",
                  language === "en" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("fi")}
                className={cn(
                  "px-1.5 py-0.5 font-bold rounded cursor-pointer transition-colors",
                  language === "fi" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
                )}
              >
                FI
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer mr-2"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {session?.user ? (
              <Link
                href={session.user.role === "DRIVER" ? "/driver" : "/admin"}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                {session.user.role === "DRIVER" ? t("btn_driver_portal") : t("btn_admin_portal")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Drawer) */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-zinc-950/95 transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ top: "80px" }}
        id="mobile-menu"
      >
        <div className="space-y-1 px-4 pb-6 pt-4 border-t border-white/5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="block rounded-md px-3 py-3 text-base font-semibold text-zinc-300 hover:bg-white/5 hover:text-amber-500 transition-all"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-6 border-t border-white/5 space-y-3">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-center gap-2 py-2 border-b border-white/5 text-[11px]">
              <button
                onClick={() => setLanguage("en")}
                className={cn(
                  "px-3 py-1 font-bold rounded cursor-pointer transition-colors",
                  language === "en" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
                )}
              >
                ENGLISH
              </button>
              <button
                onClick={() => setLanguage("fi")}
                className={cn(
                  "px-3 py-1 font-bold rounded cursor-pointer transition-colors",
                  language === "fi" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
                )}
              >
                SUOMI (FI)
              </button>
            </div>

            {/* Mobile Theme Switcher */}
            <div className="flex items-center justify-center gap-2 py-2 border-b border-white/5 text-[11px]">
              <span className="text-zinc-500 uppercase font-bold tracking-widest mr-2">{t("theme")}:</span>
              <button
                onClick={toggleTheme}
                className="px-3 py-1 font-bold rounded cursor-pointer transition-colors bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
              >
                {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
              </button>
            </div>

            {session?.user ? (
              <Link
                href={session.user.role === "DRIVER" ? "/driver" : "/admin"}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-md bg-amber-500 py-3 text-sm font-bold uppercase tracking-wider text-zinc-950"
              >
                <Shield className="h-4 w-4" />
                {session.user.role === "DRIVER" ? t("btn_driver_portal") : t("btn_admin_portal")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-md border border-white/20 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/5"
                >
                  <LogIn className="h-4 w-4" />
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-md bg-amber-500 py-3 text-sm font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-600"
                >
                  <UserPlus className="h-4 w-4" />
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
