import React from "react";
import { db } from "@/lib/db";
import { VehicleManagerClient } from "@/components/vehicles/vehicle-manager-client";

export const revalidate = 0;

export default async function VehiclesPage() {
  const vehicles = await db.vehicle.findMany({
    include: {
      currentDriver: true,
    },
    orderBy: {
      createdAt: "desc",
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

  return <VehicleManagerClient vehicles={vehicles} drivers={drivers} />;
}
