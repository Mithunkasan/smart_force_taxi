"use client";

import React from "react";
import { Compass, Shield, Route, ClipboardList, Settings, MonitorPlay } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

export default function ServicesSection() {
  const { t } = useTranslation();

  const services = [
    {
      icon: <Compass className="w-6 h-6 text-amber-500" />,
      title: t("service_dispatch_title"),
      description: t("service_dispatch_desc"),
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: t("service_logistics_title"),
      description: t("service_logistics_desc"),
    },
    {
      icon: <Route className="w-6 h-6 text-blue-500" />,
      title: t("service_telemetry_title"),
      description: t("service_telemetry_desc"),
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-yellow-500" />,
      title: t("service_auditing_title"),
      description: t("service_auditing_desc"),
    },
    {
      icon: <Settings className="w-6 h-6 text-indigo-500" />,
      title: t("service_maintenance_title"),
      description: t("service_maintenance_desc"),
    },
    {
      icon: <MonitorPlay className="w-6 h-6 text-emerald-500" />,
      title: t("service_verification_title"),
      description: t("service_verification_desc"),
    },
  ];

  return (
    <section id="services" className="relative py-24 bg-muted/40 border-y border-border text-foreground overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">{t("services_title")}</h2>
          <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
            {t("services_subtitle")}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light">
            {t("services_desc")}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="p-8 bg-card border border-border rounded-2xl hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1.5 group relative"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent group-hover:via-amber-500/40 transition-all duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/10 transition-all duration-300">
                {service.icon}
              </div>
              <h4 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 group-hover:text-amber-500 transition-colors">
                {service.title}
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed font-light">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
