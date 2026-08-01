"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TripStatus, Priority } from "@prisma/client";

// Validate driver or vehicle scheduling overlap
async function checkOverlap(
  driverId: string | null,
  vehicleId: string,
  startTime: Date,
  endTime: Date,
  excludeTripId?: string
) {
  // 1. Check Driver Overlap
  if (driverId) {
    const driverOverlap = await db.trip.findFirst({
      where: {
        id: excludeTripId ? { not: excludeTripId } : undefined,
        driverId,
        status: { not: "CANCELLED" },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (driverOverlap) {
      return {
        overlap: true,
        message: `Driver is already assigned to active/scheduled Trip ${driverOverlap.tripNumber} between ${new Date(
          driverOverlap.startTime
        ).toLocaleString()} and ${new Date(driverOverlap.endTime).toLocaleString()}.`,
      };
    }
  }

  // 2. Check Vehicle Overlap
  const vehicleOverlap = await db.trip.findFirst({
    where: {
      id: excludeTripId ? { not: excludeTripId } : undefined,
      vehicleId,
      status: { not: "CANCELLED" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (vehicleOverlap) {
    return {
      overlap: true,
      message: `Vehicle is already assigned to active/scheduled Trip ${vehicleOverlap.tripNumber} between ${new Date(
        vehicleOverlap.startTime
      ).toLocaleString()} and ${new Date(vehicleOverlap.endTime).toLocaleString()}.`,
    };
  }

  return { overlap: false };
}

export async function createTrip(data: {
  tripNumber: string;
  requestedBy: string;
  department: string;
  pickup: string;
  destination: string;
  startTime: string;
  endTime: string;
  purpose: string;
  priority: Priority;
  driverId?: string;
  vehicleId: string;
  notes?: string;
}) {
  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { error: "End time must be after start time." };
    }

    // Overlap validation check (skip driver check at creation)
    const check = await checkOverlap(null, data.vehicleId, start, end);
    if (check.overlap) {
      return { error: check.message };
    }

    // Create trip
    await db.trip.create({
      data: {
        tripNumber: data.tripNumber,
        requestedBy: data.requestedBy,
        department: data.department,
        pickup: data.pickup,
        destination: data.destination,
        startTime: start,
        endTime: end,
        purpose: data.purpose,
        priority: data.priority,
        status: TripStatus.PENDING,
        driverId: null,
        vehicleId: data.vehicleId,
        notes: data.notes,
      },
    });

    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Create trip error:", error);
    return { error: error.message || "Failed to create trip" };
  }
}

export async function updateTrip(
  id: string,
  data: {
    tripNumber: string;
    requestedBy: string;
    department: string;
    pickup: string;
    destination: string;
    startTime: string;
    endTime: string;
    purpose: string;
    priority: Priority;
    driverId?: string | null;
    vehicleId: string;
    status: TripStatus;
    notes?: string;
  }
) {
  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { error: "End time must be after start time." };
    }

    // Validate overlap excluding the current trip itself
    if (data.status !== "CANCELLED") {
      const check = await checkOverlap(data.driverId || null, data.vehicleId, start, end, id);
      if (check.overlap) {
        return { error: check.message };
      }
    }

    // Update trip details
    await db.trip.update({
      where: { id },
      data: {
        tripNumber: data.tripNumber,
        requestedBy: data.requestedBy,
        department: data.department,
        pickup: data.pickup,
        destination: data.destination,
        startTime: start,
        endTime: end,
        purpose: data.purpose,
        priority: data.priority,
        status: data.status,
        driverId: data.driverId || null,
        vehicleId: data.vehicleId,
        notes: data.notes,
      },
    });

    // If status changes to started or completed, update vehicle status as well
    if (data.status === "STARTED") {
      await db.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: "ON_TRIP" },
      });
    } else if (data.status === "COMPLETED" || data.status === "CANCELLED") {
      await db.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: "AVAILABLE" },
      });
    }

    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Update trip error:", error);
    return { error: error.message || "Failed to update trip" };
  }
}

export async function deleteTrip(id: string) {
  try {
    await db.trip.delete({
      where: { id },
    });
    revalidatePath("/admin/trips");
    return { success: true };
  } catch (error: any) {
    console.error("Delete trip error:", error);
    return { error: error.message || "Failed to delete trip" };
  }
}
