import React from "react";
import { db } from "@/lib/db";
import { ShiftManagerClient } from "@/components/shifts/shift-manager-client";

export const revalidate = 0;

export default async function ShiftsPage() {
  // Query driverShift logs
  const shifts = await db.driverShift.findMany({
    include: {
      driver: true,
    },
    orderBy: {
      actualStart: "desc",
    },
  });

  return <ShiftManagerClient shifts={shifts} />;
}
