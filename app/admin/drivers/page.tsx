import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DriverManagerClient } from "@/components/drivers/driver-manager-client";

export const revalidate = 0;

export default async function DriversPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "TRANSPORT_MANAGER")) {
    redirect("/login");
  }

  // Fetch all DRIVER users
  const drivers = await db.user.findMany({
    where: {
      role: "DRIVER",
    },
    include: {
      assignedVehicle: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all trips (bookings)
  const bookings = await db.trip.findMany({
    include: {
      driver: true,
      vehicle: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  // Fetch all active vehicles for the booking dropdown
  const vehicles = await db.vehicle.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <DriverManagerClient
      drivers={drivers}
      bookings={bookings}
      vehicles={vehicles}
      currentUserName={session.user.name || "Admin"}
    />
  );
}
