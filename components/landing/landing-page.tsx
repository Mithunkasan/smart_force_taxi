"use client";

import React from "react";
import Navbar from "./navbar";
import HeroSection from "./hero-section";
import AboutSection from "./about-section";
import ServicesSection from "./services-section";
import FleetSection from "./fleet-section";
import WhyChooseUsSection from "./why-choose-us";
import ContactSection from "./contact-section";
import Footer from "./footer";

interface LandingPageProps {
  session: any;
}

export default function LandingPage({ session }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground overflow-x-hidden antialiased">
      {/* Structural Schema and Metadata for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TaxiService",
            "name": "Smart Force Taxi",
            "url": "http://localhost:3000",
            "logo": "http://localhost:3000/logo.png",
            "image": "http://localhost:3000/images/luxury_sedan.jpg",
            "description": "Smart Force Taxi provides luxury fleet services, automated dispatch, live GPS tracking, and verified driver schedules.",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Smart Force Taxi Logistics",
              "telephone": "+1-800-555-TAXI",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "100 Fleet Parkway, Suite 500",
                "addressLocality": "Tech City",
                "postalCode": "94025"
              }
            },
            "areaServed": "Statewide Corporate Hubs",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Fleet Transport services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Executive Private Chauffeur"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Corporate Employee Shuttle Services"
                  }
                }
              ]
            }
          })
        }}
      />

      {/* Navigation Header */}
      <Navbar session={session} />

      {/* Main Sections */}
      <main className="w-full">
        {/* Scroll-driven Video Hero */}
        <HeroSection />

        {/* Content sections scrolling over the video */}
        <div className="relative z-20 bg-background">
          {/* Logo Transition Section */}
          <div className="h-screen w-full bg-background" />

          {/* Company Mission & Core stats */}
          <AboutSection />

          {/* Dispatch & Operations services */}
          <ServicesSection />

          {/* Interactive Fleet Showcase */}
          <FleetSection />

          {/* Operational Advantages */}
          <WhyChooseUsSection />

          {/* Contact desk & Inquiry Desk */}
          <ContactSection />
        </div>
      </main>

      {/* Footer Links & Newsletter */}
      <Footer />
    </div>
  );
}
