"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import { useTranslation } from "@/components/layout/language-provider";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { theme } = useTheme();
  const { t } = useTranslation();

  const logoSrc = theme === "dark" ? "/logo.png" : "/logo1.png";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

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
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
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
    <footer className="bg-zinc-950 text-zinc-400 border-t border-white/5 pt-16 pb-12 overflow-hidden relative z-20">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="#home" onClick={(e) => handleLinkClick(e, "#home")} className="inline-block">
              <img
                src={logoSrc}
                alt="Smart Force Taxi Logo"
                className="h-12 w-auto object-contain dark:brightness-110"
              />
            </Link>
            <p className="text-xs font-light leading-relaxed text-zinc-500 max-w-sm">
              {t("hero_desc")}
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-zinc-950 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-zinc-950 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-zinc-950 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 lg:col-start-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">{t("platform_links")}</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-xs font-light text-zinc-500 hover:text-amber-500 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-xs font-light text-zinc-500 hover:text-amber-500 transition-colors">
                  {t("btn_driver_login")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-xs font-light text-zinc-500 hover:text-amber-500 transition-colors">
                  {t("btn_driver_reg")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">{t("fleet_updates")}</h4>
            <p className="text-xs font-light text-zinc-500 leading-relaxed">
              Subscribe to receive updates regarding automated routes, shuttle dispatch logs, and pricing revisions.
            </p>
            
            {subscribed ? (
              <div className="p-3.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span>Subscription verified! Thank you.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center w-10 h-10 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-md shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-[10px] text-zinc-500 uppercase tracking-widest">
            <span>{t("powered_by")} <strong className="text-zinc-400">Smart Force Taxi</strong></span>
            <span>•</span>
            <Link href="#" className="hover:text-amber-500">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-amber-500">Terms of Service</Link>
          </div>
          <p className="text-[10px] text-zinc-600 text-center sm:text-right uppercase tracking-wider">
            © 2026 Smart Force Taxi. {t("all_rights_reserved")}
          </p>
        </div>

      </div>
    </footer>
  );
}
