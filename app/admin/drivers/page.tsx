import React from "react";
import { db } from "@/lib/db";
import { DriverManagerClient } from "@/components/drivers/driver-manager-client";

export const revalidate = 0;

export default async function DriversPage() {
  const drivers = await db.user.findMany({
    where: {
      role: "DRIVER",
    },
    include: {
      assignedVehicles: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get active driver IDs who are currently on active trips
  const activeTrips = await db.trip.findMany({
    where: {
      status: "IN_PROGRESS",
    },
    select: {
      driverId: true,
    },
  });

  const activeDriverIds = Array.from(new Set(activeTrips.map((t) => t.driverId).filter((id): id is string => id !== null)));

  return <DriverManagerClient drivers={drivers} activeDriverIds={activeDriverIds} />;
}
