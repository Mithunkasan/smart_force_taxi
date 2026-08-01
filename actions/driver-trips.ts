"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TripStatus, VehicleStatus, VerificationStatus } from "@prisma/client";

// Start a scheduled trip
export async function startTripAction(tripId: string, vehicleId: string) {
  try {
    // 1. Set trip status to STARTED
    await db.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.STARTED },
    });

    // 2. Set vehicle status to ON_TRIP
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.ON_TRIP },
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Start trip error:", error);
    return { error: error.message || "Failed to start trip" };
  }
}

// Complete trip and submit closing data (atomic transaction)
export async function closeTripAction(
  tripId: string,
  vehicleId: string,
  closing: {
    startingOdometer: number;
    endingOdometer: number;
    distanceTravelled: number;
    tripAmount: number;
    fuelExpense: number;
    tollExpense: number;
    parkingCharges: number;
    otherExpenses: number;
    remarks: string;
  },
  parking: {
    location: string;
    address: string;
    landmark: string;
    googleMapsLink: string;
  },
  condition: {
    fuelLevel: string;
    tyreCondition: string;
    interiorCondition: string;
    exteriorCondition: string;
    remarks: string;
  }
) {
  try {
    if (closing.endingOdometer < closing.startingOdometer) {
      return { error: "Ending odometer cannot be less than starting odometer." };
    }

    if (!parking.googleMapsLink || !/^https?:\/\/\S+/.test(parking.googleMapsLink)) {
      return { error: "A valid Parking Location URL (starting with http:// or https://) is required." };
    }

    // Run as transaction to guarantee data integrity
    await db.$transaction(async (tx) => {
      // 1. Create Trip Closing record
      await tx.tripClosing.create({
        data: {
          tripId,
          startingOdometer: Number(closing.startingOdometer),
          endingOdometer: Number(closing.endingOdometer),
          distanceTravelled: Number(closing.distanceTravelled),
          tripAmount: Number(closing.tripAmount),
          fuelExpense: Number(closing.fuelExpense),
          tollExpense: Number(closing.tollExpense),
          parkingCharges: Number(closing.parkingCharges),
          otherExpenses: Number(closing.otherExpenses),
          remarks: closing.remarks,
        },
      });

      // 2. Create Parking Location record
      await tx.parkingLocation.create({
        data: {
          tripId,
          location: parking.location,
          address: parking.address,
          landmark: parking.landmark,
          googleMapsLink: parking.googleMapsLink,
        },
      });

      // 3. Create Vehicle Condition Report
      await tx.vehicleConditionReport.create({
        data: {
          tripId,
          fuelLevel: condition.fuelLevel,
          tyreCondition: condition.tyreCondition,
          interiorCondition: condition.interiorCondition,
          exteriorCondition: condition.exteriorCondition,
          remarks: condition.remarks,
        },
      });

      // 4. Create Admin Verification record in PENDING status
      await tx.adminVerification.create({
        data: {
          tripId,
          status: VerificationStatus.PENDING,
          remarks: "Pending initial audit comparison.",
        },
      });

      // 5. Update Trip status to COMPLETED
      await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.COMPLETED },
      });

      // 6. Update Vehicle status to AVAILABLE and sync Odometer
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: VehicleStatus.AVAILABLE,
          odometer: Number(closing.endingOdometer),
        },
      });

      // 7. Send a notification to administrators
      // Find a super admin
      const admin = await tx.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });

      if (admin) {
        const trip = await tx.trip.findUnique({
          where: { id: tripId },
          select: { tripNumber: true },
        });

        await tx.notification.create({
          data: {
            userId: admin.id,
            message: `Trip ${trip?.tripNumber || "ID: " + tripId} completed. Pending audit verification.`,
            type: "VERIFICATION_PENDING",
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin/verification");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Close trip error:", error);
    return { error: error.message || "Failed to complete trip closure" };
  }
}

// Driver reporting issue action
export async function reportVehicleIssue(
  vehicleId: string,
  driverId: string,
  issueDescription: string
) {
  try {
    // Set vehicle status to BREAKDOWN
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { status: "BREAKDOWN" },
    });

    // Notify administrators
    const admin = await db.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });

    if (admin) {
      const vehicle = await db.vehicle.findUnique({
        where: { id: vehicleId },
        select: { vehicleNumber: true },
      });

      await db.notification.create({
        data: {
          userId: admin.id,
          message: `Vehicle breakdown reported for ${vehicle?.vehicleNumber || vehicleId}: ${issueDescription}`,
          type: "BREAKDOWN_REPORTED",
        },
      });
    }

    revalidatePath("/driver");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Breakdown error:", error);
    return { error: error.message || "Failed to report issue" };
  }
}

// Driver accepts a pending unassigned trip
export async function acceptTripAction(tripId: string, driverId: string) {
  try {
    // 1. Fetch the trip
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true },
    });

    if (!trip) {
      return { error: "Trip not found." };
    }

    if (trip.driverId) {
      return { error: "This job has already been accepted by another driver." };
    }

    // 2. Check if the driver is already assigned to a trip during this time range
    const overlap = await db.trip.findFirst({
      where: {
        driverId,
        status: { in: ["ASSIGNED", "APPROVED", "STARTED"] },
        startTime: { lt: trip.endTime },
        endTime: { gt: trip.startTime },
      },
    });

    if (overlap) {
      return {
        error: `You are already assigned to active/scheduled Trip ${overlap.tripNumber} during this time range (${new Date(
          overlap.startTime
        ).toLocaleTimeString()} - ${new Date(overlap.endTime).toLocaleTimeString()}).`,
      };
    }

    // 3. Assign the driver and change the status to ASSIGNED
    await db.trip.update({
      where: { id: tripId },
      data: {
        driverId,
        status: TripStatus.ASSIGNED,
      },
    });

    // 4. Send a notification to administrators
    const admin = await db.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });

    if (admin) {
      const driver = await db.user.findUnique({
        where: { id: driverId },
        select: { name: true },
      });

      await db.notification.create({
        data: {
          userId: admin.id,
          message: `Trip ${trip.tripNumber} has been accepted by Driver ${driver?.name || "Unknown"}.`,
          type: "VEHICLE_ASSIGNMENT",
        },
      });
    }

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Accept trip error:", error);
    return { error: error.message || "Failed to accept trip" };
  }
}
