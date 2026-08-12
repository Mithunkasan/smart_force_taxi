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

  const driver = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!driver) {
    redirect("/login");
  }

  // Find active driver shift
  const activeShift = await db.driverShift.findFirst({
    where: {
      driverId: driver.id,
      actualEnd: null,
    },
  });

  // Find currently assigned vehicle to driver
  const assignedVehicle = await db.vehicle.findFirst({
    where: {
      currentDriverId: driver.id,
    },
  });

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

  return (
    <DriverDashboardClient
      driver={driver}
      activeShift={activeShift}
      assignedVehicle={assignedVehicle}
      vehicles={vehicles}
      bookings={bookings}
      activeTrip={activeTrip}
    />
  );
}
