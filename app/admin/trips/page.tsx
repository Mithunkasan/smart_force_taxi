import React from "react";
import { db } from "@/lib/db";
import { TripManagerClient } from "@/components/trips/trip-manager-client";

export const revalidate = 0;

export default async function TripsPage() {
  const trips = await db.trip.findMany({
    include: {
      driver: true,
      vehicle: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  const drivers = await db.user.findMany({
    where: {
      role: "DRIVER",
    },
    orderBy: {
      name: "asc",
    },
  });

  const vehicles = await db.vehicle.findMany({
    orderBy: {
      vehicleNumber: "asc",
    },
  });

  return <TripManagerClient trips={trips} drivers={drivers} vehicles={vehicles} />;
}
