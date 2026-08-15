import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AvailableVehiclesClient } from "@/components/drivers/available-vehicles-client";

export const revalidate = 0;

export default async function AvailableVehiclesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  // Fetch only AVAILABLE vehicles
  const vehicles = await db.vehicle.findMany({
    where: {
      status: "AVAILABLE",
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

  return (
    <AvailableVehiclesClient
      vehicles={vehicles}
      bookings={bookings}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      currentUserName={session.user.name || ""}
    />
  );
}
