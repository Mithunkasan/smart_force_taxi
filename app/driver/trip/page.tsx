import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DriverTripsClient } from "@/components/drivers/driver-trips-client";

export const revalidate = 0;

export default async function DriverTripsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const trips = await db.trip.findMany({
    where: {
      OR: [
        { driverId: session.user.id },
        { driverId: null, status: { in: ["PENDING", "APPROVED"] } }
      ]
    },
    include: {
      vehicle: {
        include: {
          trips: {
            where: {
              status: "COMPLETED",
              parking: { isNot: null },
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
      },
      closing: true,
      parking: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return <DriverTripsClient trips={trips} driverId={session.user.id} />;
}
