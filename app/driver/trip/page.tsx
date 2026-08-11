import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DriverTripsClient } from "@/components/drivers/driver-trips-client";

export const revalidate = 0;

export default async function DriverTripsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  // Load all trips assigned or driven by this driver
  const trips = await db.trip.findMany({
    where: {
      driverId: session.user.id,
    },
    include: {
      vehicle: true,
      closing: true,
      parking: true,
      conditionReport: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return <DriverTripsClient trips={trips} driverId={session.user.id} />;
}
