import React from "react";
import { db } from "@/lib/db";
import { FuelManagerClient } from "@/components/fuel/fuel-manager-client";

export const revalidate = 0;

export default async function FuelPage() {
  const logs = await db.fuelLog.findMany({
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const vehicles = await db.vehicle.findMany({
    orderBy: {
      vehicleNumber: "asc",
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

  return <FuelManagerClient logs={logs} vehicles={vehicles} drivers={drivers} />;
}
