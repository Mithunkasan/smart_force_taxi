import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DriverDashboardClient } from "@/components/drivers/driver-dashboard-client";

export const revalidate = 0;

export default async function DriverDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  // Fetch driver complete profile
  const driver = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      attendance: {
        orderBy: { checkIn: "desc" },
        take: 10,
      },
    },
  });

  if (!driver) {
    redirect("/login");
  }

  // Find active clock-in
  const activeAttendance = await db.attendance.findFirst({
    where: {
      driverId: driver.id,
      checkOut: null,
    },
  });

  // Calculate assigned and completed trip counts
  const assignedTripsCount = await db.trip.count({
    where: {
      driverId: driver.id,
      status: {
        in: ["ASSIGNED", "APPROVED", "STARTED"],
      },
    },
  });

  const completedTripsCount = await db.trip.count({
    where: {
      driverId: driver.id,
      status: "COMPLETED",
    },
  });

  return (
    <DriverDashboardClient
      driver={driver}
      activeAttendance={activeAttendance}
      assignedTripsCount={assignedTripsCount}
      completedTripsCount={completedTripsCount}
    />
  );
}
