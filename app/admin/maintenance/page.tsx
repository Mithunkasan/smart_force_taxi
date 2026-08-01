import React from "react";
import { db } from "@/lib/db";
import { MaintenanceManagerClient } from "@/components/maintenance/maintenance-manager-client";

export const revalidate = 0;

export default async function MaintenancePage() {
  const logs = await db.maintenance.findMany({
    include: {
      vehicle: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const vehicles = await db.vehicle.findMany({
    orderBy: {
      vehicleNumber: "asc",
    },
  });

  return <MaintenanceManagerClient logs={logs} vehicles={vehicles} />;
}
