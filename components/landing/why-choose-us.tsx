"use client";

import React from "react";
import { Check, Shield, MapPin, BadgeDollarSign, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

export default function WhyChooseUsSection() {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: <Shield className="w-5 h-5 text-amber-500" />,
      title: t("pillar_audit_title"),
      description: t("pillar_audit_desc"),
    },
    {
      icon: <MapPin className="w-5 h-5 text-amber-500" />,
      title: t("pillar_tracking_title"),
      description: t("pillar_tracking_desc"),
    },
    {
      icon: <BadgeDollarSign className="w-5 h-5 text-amber-500" />,
      title: t("pillar_fuel_title"),
      description: t("pillar_fuel_desc"),
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-amber-500" />,
      title: t("pillar_incident_title"),
      description: t("pillar_incident_desc"),
    },
  ];

  const bulletPoints = [
    t("bullet_1"),
    t("bullet_2"),
    t("bullet_3"),
    t("bullet_4"),
    t("bullet_5"),
    t("bullet_6"),
  ];

  return (
    <section id="why-choose-us" className="relative py-24 bg-muted/40 border-y border-border text-foreground overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Visual feature checklist */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">{t("advantage_title")}</h2>
            <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-8">
              {t("advantage_subtitle")}
            </h3>
            <p className="text-muted-foreground text-sm font-light mb-8 leading-relaxed">
              {t("advantage_desc")}
            </p>
            
            {/* Checklist */}
            <div className="space-y-4">
              {bulletPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground font-light leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Key pillars cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-card border border-border rounded-2xl hover:border-amber-500/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-5 group-hover:bg-amber-500/10 transition-colors">
                  {item.icon}
                </div>
                <h4 className="text-base font-bold uppercase tracking-tight text-foreground mb-2 group-hover:text-amber-500 transition-colors">
                  {item.title}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            ))}
            
            {/* Call to action card */}
            <div className="p-6 bg-gradient-to-tr from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl flex flex-col justify-between sm:col-span-2">
              <div>
                <h4 className="text-lg font-bold uppercase tracking-tight text-amber-500 mb-2">
                  {t("cta_title")}
                </h4>
                <p className="text-muted-foreground text-xs font-light leading-relaxed mb-6">
                  {t("cta_desc")}
                </p>
              </div>
              <div>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-amber-500 text-zinc-950 font-bold uppercase tracking-wider text-[11px] rounded-lg hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/15 transition-all"
                >
                  {t("cta_btn")}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
