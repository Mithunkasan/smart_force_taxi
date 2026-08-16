import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DriverPortalClient } from "@/components/drivers/driver-portal-client";

export const revalidate = 0;

export default async function DriverDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const driver = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!driver) {
    redirect("/login?error=SessionExpired");
  }

  // Find all vehicles
  const vehicles = await db.vehicle.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Find all bookings (trips) that are not completed/cancelled
  const bookings = await db.trip.findMany({
    where: {
      status: {
        notIn: ["CANCELLED", "COMPLETED"],
      },
    },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  // Find active work trip (ASSIGNED, ACCEPTED, or IN_PROGRESS)
  const activeTrip = await db.trip.findFirst({
    where: {
      driverId: driver.id,
      status: {
        in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"],
      },
    },
    include: {
      vehicle: true,
    },
  });

  // Find vehicle permanently assigned to this driver
  const assignedVehicle = await db.vehicle.findFirst({
    where: {
      assignedDriverId: driver.id,
    },
  });

  // Find all weekly logs
  const logs = await db.weeklyLog.findMany({
    where: { driverId: driver.id },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <DriverPortalClient
      driver={driver}
      activeShift={null}
      assignedVehicle={assignedVehicle}
      vehicles={vehicles}
      bookings={bookings}
      activeTrip={activeTrip}
      logs={logs}
    />
  );
}

