import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Force Taxi | Premium Corporate Fleet & Taxi Service",
  description: "Enterprise-grade Taxi Service and Fleet Management Platform. Real-time telemetry, live GPS tracking, and audited trip closures.",
  keywords: [
    "smart force taxi",
    "fleet management",
    "taxi service",
    "corporate shuttle",
    "driver scheduling",
    "fuel tracking"
  ],
};

export default async function Home() {
  const session = await auth();

  // If user is already logged in, redirect them to their respective dashboard
  if (session?.user) {
    if (session.user.role === "DRIVER") {
      redirect("/driver");
    } else {
      redirect("/admin");
    }
  }

  // Otherwise, display the high-fidelity public landing page
  return <LandingPage session={session} />;
}
