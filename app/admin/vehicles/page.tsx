import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VehicleManagerClient } from "@/components/vehicles/vehicle-manager-client";

export const revalidate = 0;

export default async function VehiclesPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "TRANSPORT_MANAGER")) {
    redirect("/login");
  }

  const vehicles = await db.vehicle.findMany({
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

  return <VehicleManagerClient vehicles={vehicles} drivers={drivers} bookings={bookings} />;
}
