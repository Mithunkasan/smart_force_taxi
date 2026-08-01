"use client";

import React from "react";
import { Users, ShieldCheck, Award, Zap } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

export default function AboutSection() {
  const { t } = useTranslation();

  const stats = [
    { number: "500+", label: t("stat_vehicles"), description: t("stat_vehicles_desc") },
    { number: "1.2M+", label: t("stat_trips"), description: t("stat_trips_desc") },
    { number: "99.9%", label: t("stat_ontime"), description: t("stat_ontime_desc") },
    { number: "100%", label: t("stat_drivers"), description: t("stat_drivers_desc") },
  ];

  const features = [
    {
      icon: <Users className="w-6 h-6 text-amber-500" />,
      title: t("feature_passenger_title"),
      description: t("feature_passenger_desc"),
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      title: t("feature_auditing_title"),
      description: t("feature_auditing_desc"),
    },
    {
      icon: <Award className="w-6 h-6 text-blue-500" />,
      title: t("feature_chauffeurs_title"),
      description: t("feature_chauffeurs_desc"),
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: t("feature_telemetry_title"),
      description: t("feature_telemetry_desc"),
    },
  ];

  return (
    <section id="about" className="relative py-24 bg-background text-foreground overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">{t("identity")}</h2>
          <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
            {t("about_title")}
          </h3>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-light">
            {t("about_desc_main")}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6">
            <h4 className="text-2xl font-bold uppercase tracking-tight text-foreground">
              {t("about_future_title")}
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              {t("about_future_desc_1")}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              {t("about_future_desc_2")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-card border border-border rounded-2xl hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h5 className="text-base font-bold uppercase tracking-tight mb-2 text-foreground group-hover:text-amber-500 transition-colors">
                  {feature.title}
                </h5>
                <p className="text-muted-foreground text-xs leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center p-8 bg-card border border-border rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              <p className="text-4xl sm:text-5xl font-black text-amber-500 tracking-tight mb-2">
                {stat.number}
              </p>
              <p className="text-sm font-bold uppercase text-foreground tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
