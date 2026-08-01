"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Users, Briefcase, Zap, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

export default function FleetSection() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");

  const categories = [
    { key: "All", label: t("cat_all") },
    { key: "Luxury", label: t("cat_luxury") },
    { key: "Executive", label: t("cat_executive") },
    { key: "Eco-Friendly", label: t("cat_eco") },
  ];

  const vehicles = [
    {
      name: "Mercedes-Benz S-Class",
      category: "Luxury",
      image: "/images/luxury_sedan.jpg",
      seating: 4,
      luggage: 3,
      engine: "Twin-Turbo V6 / Hybrid",
      features: ["Leather Massage Seats", "Burmester Surround Sound", "Ambient lighting", "Chauffeur Driven"],
      status: "Available",
    },
    {
      name: "Cadillac Escalade Platinum",
      category: "Executive",
      image: "/images/executive_suv.jpg",
      seating: 7,
      luggage: 6,
      engine: "6.2L V8 / 4WD",
      features: ["OLED Infotainment Screen", "Panoramic Sunroof", "Executive Captain Chairs", "Wi-Fi Hotspot"],
      status: "Available",
    },
    {
      name: "Tesla Model Y Performance",
      category: "Eco-Friendly",
      image: "/images/eco_hybrid.jpg",
      seating: 5,
      luggage: 4,
      engine: "Dual Motor AWD (Electric)",
      features: ["Full Self-Driving Computer", "Minimalist glass dome", "Premium Vegan Leather", "Zero Emissions"],
      status: "Available",
    },
    {
      name: "Mercedes-Benz Sprinter Shuttle",
      category: "Executive",
      image: "/images/corporate_shuttle.jpg",
      seating: 12,
      luggage: 10,
      engine: "2.0L Turbo Diesel",
      features: ["Conference Seating Layout", "Standing headroom", "Underseat USB hubs", "Telemetry Tracked"],
      status: "Assigned",
    },
  ];

  const filteredVehicles =
    activeFilter === "All"
      ? vehicles
      : vehicles.filter((v) => v.category === activeFilter);

  return (
    <section id="fleet" className="relative py-24 bg-background text-foreground overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">{t("fleet_title_section")}</h2>
          <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
            {t("fleet_subtitle_section")}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light">
            {t("fleet_desc_section")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveFilter(category.key)}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer ${
                activeFilter === category.key
                  ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/10"
                  : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-3xl overflow-hidden group hover:border-amber-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 flex flex-col"
            >
              {/* Image Showcase */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={vehicle.image}
                  alt={vehicle.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index < 2}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                      vehicle.status === "Available"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        vehicle.status === "Available" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    {vehicle.status === "Available" ? t("status_available") : t("status_assigned")}
                  </span>
                </div>

                {/* Category tag */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="px-2.5 py-0.5 rounded bg-amber-500 text-zinc-950 text-[10px] font-extrabold uppercase tracking-wider">
                    {vehicle.category === "Luxury" ? t("cat_luxury") : vehicle.category === "Executive" ? t("cat_executive") : t("cat_eco")}
                  </span>
                </div>
              </div>

              {/* Specs & Info */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-amber-500 transition-colors">
                    {vehicle.name}
                  </h4>
                  
                  {/* Performance specs row */}
                  <div className="grid grid-cols-3 gap-2 border-y border-border py-4 mb-6">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">{t("seating")}</p>
                      <div className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                        <Users className="w-4 h-4 text-amber-500/80" />
                        {vehicle.seating} {t("seats_label")}
                      </div>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">{t("luggage")}</p>
                      <div className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                        <Briefcase className="w-4 h-4 text-amber-500/80" />
                        {vehicle.luggage} {t("bags_label")}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">{t("drivetrain")}</p>
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-foreground truncate max-w-full">
                        <Zap className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                        <span className="truncate">{vehicle.engine.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights list */}
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{t("key_integration")}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {vehicle.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-xs text-muted-foreground font-light">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
