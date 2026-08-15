"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Driver/Admin books a car slot
export async function bookCarAction(data: {
  vehicleId: string;
  driverId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  pickup: string;
  destination: string;
  purpose: string;
  notes?: string;
  assignedBy: "DRIVER" | "ADMIN";
  requestedBy: string;
}) {
  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { error: "End time must be after start time." };
    }

    // 1. Verify vehicle is not offline or in maintenance
    const vehicle = await db.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      return { error: "Vehicle not found." };
    }

    if (vehicle.status === "OFFLINE" || vehicle.status === "MAINTENANCE") {
      return { error: "This vehicle is currently offline or under maintenance." };
    }

    // 2. Validate vehicle availability / slot conflicts
    const conflict = await db.trip.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (conflict) {
      return { error: "This vehicle is already booked during the selected time slot." };
    }

    // 3. Validate driver availability / slot conflicts
    const driverConflict = await db.trip.findFirst({
      where: {
        driverId: data.driverId,
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (driverConflict) {
      return { error: "The selected driver already has another booking during this time slot." };
    }

    // 4. Generate unique trip/work number
    let tripNumber = "";
    while (true) {
      tripNumber = "WRK-" + Math.floor(1000 + Math.random() * 9000);
      const exists = await db.trip.findUnique({
        where: { tripNumber },
      });
      if (!exists) break;
    }

    // 5. Create trip/booking
    await db.$transaction(async (tx) => {
      await tx.trip.create({
        data: {
          tripNumber,
          pickup: data.pickup,
          destination: data.destination,
          startTime: start,
          endTime: end,
          purpose: data.purpose,
          notes: data.notes || null,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          status: data.assignedBy === "ADMIN" ? "ASSIGNED" : "ACCEPTED",
          assignedBy: data.assignedBy,
          requestedBy: data.requestedBy,
          department: "Operations",
        },
      });
    });

    revalidatePath("/driver");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Book car action error:", error);
    return { error: error.message || "Failed to book vehicle." };
  }
}
