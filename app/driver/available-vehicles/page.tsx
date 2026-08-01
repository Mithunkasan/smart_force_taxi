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

  // Fetch only AVAILABLE vehicles and include their latest completed trip's parking location
  const vehicles = await db.vehicle.findMany({
    where: {
      status: "AVAILABLE",
    },
    include: {
      trips: {
        where: {
          status: "COMPLETED",
          parking: {
            isNot: null,
          },
        },
        orderBy: {
          endTime: "desc",
        },
        take: 1,
        include: {
          parking: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Transform to extract the latest parking location directly
  const availableVehicles = vehicles.map((vehicle) => {
    const latestTrip = vehicle.trips[0] || null;
    const latestParking = latestTrip?.parking || null;

    return {
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      seatingCapacity: vehicle.seatingCapacity,
      odometer: vehicle.odometer,
      status: vehicle.status,
      parkingLocation: latestParking
        ? {
            location: latestParking.location,
            address: latestParking.address,
            landmark: latestParking.landmark,
            googleMapsLink: latestParking.googleMapsLink,
            parkingTime: latestParking.parkingTime,
          }
        : null,
    };
  });

  return <AvailableVehiclesClient vehicles={availableVehicles} />;
}
