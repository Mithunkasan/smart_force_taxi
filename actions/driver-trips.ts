"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TripStatus } from "@prisma/client";

// Driver self-assigns a new work / trip
export async function driverCreateWorkAction(
  driverId: string,
  data: {
    purpose: string;
    pickup: string;
    destination: string;
    startGpsUrl?: string;
    destinationGpsUrl?: string;
    notes?: string;
  }
) {
  try {
    // 1. Verify driver is not offline
    const driver = await db.user.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.status === "OFFLINE") {
      return { error: "You must start your shift first." };
    }

    // 2. Verify driver has an active car assigned
    const assignedVehicle = await db.vehicle.findFirst({
      where: {
        currentDriverId: driverId,
      },
    });

    if (!assignedVehicle) {
      return { error: "You must select an available car first." };
    }

    // 3. Verify driver has no active trips
    const activeTrip = await db.trip.findFirst({
      where: {
        driverId,
        status: {
          in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"],
        },
      },
    });

    if (activeTrip) {
      return { error: "You cannot start another work while already having active work." };
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

    const now = new Date();
    const mockEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours estimated duration

    await db.$transaction(async (tx) => {
      await tx.trip.create({
        data: {
          tripNumber,
          pickup: data.pickup,
          destination: data.destination,
          startTime: now,
          endTime: mockEndTime,
          purpose: data.purpose,
          notes: data.notes || null,
          startGpsUrl: data.startGpsUrl || null,
          destinationGpsUrl: data.destinationGpsUrl || null,
          driverId,
          vehicleId: assignedVehicle.id,
          status: "ASSIGNED",
          assignedBy: "DRIVER",
          requestedBy: "DRIVER",
          department: "Operations",
        },
      });
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Driver self-assign work error:", error);
    return { error: error.message || "Failed to assign work." };
  }
}

// Driver accepts backup work assigned by Admin
export async function driverAcceptWorkAction(tripId: string) {
  try {
    await db.trip.update({
      where: { id: tripId },
      data: {
        status: "ACCEPTED",
      },
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Accept work error:", error);
    return { error: error.message || "Failed to accept work." };
  }
}

// Driver starts work
export async function driverStartWorkAction(tripId: string, vehicleId: string, driverId: string) {
  try {
    await db.$transaction(async (tx) => {
      // 1. Update trip status to IN_PROGRESS
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "IN_PROGRESS",
          actualStartTime: new Date(),
        },
      });

      // 2. Set driver status to ON_TRIP
      await tx.user.update({
        where: { id: driverId },
        data: {
          status: "ON_TRIP",
        },
      });

      // 3. Set vehicle status to ON_TRIP
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "ON_TRIP",
        },
      });
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Start work error:", error);
    return { error: error.message || "Failed to start work." };
  }
}

// Driver completes work
export async function driverCompleteWorkAction(tripId: string, vehicleId: string, driverId: string) {
  try {
    await db.$transaction(async (tx) => {
      const now = new Date();

      // 1. Get trip start time to calculate duration
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { actualStartTime: true },
      });

      let durationMinutes = 0;
      if (trip?.actualStartTime) {
        const diffMs = now.getTime() - new Date(trip.actualStartTime).getTime();
        durationMinutes = Math.round(diffMs / (1000 * 60));
      }

      // 2. Update trip status to COMPLETED
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          actualEndTime: now,
          durationMinutes,
        },
      });

      // 3. Set driver status to AVAILABLE
      await tx.user.update({
        where: { id: driverId },
        data: {
          status: "AVAILABLE",
        },
      });

      // 4. Set vehicle status to AVAILABLE and clear current driver (release car)
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "AVAILABLE",
          currentDriverId: null,
        },
      });

      // 5. Close CarAssignment
      const activeAssignment = await tx.carAssignment.findFirst({
        where: {
          driverId,
          vehicleId,
          releasedAt: null,
        },
      });

      if (activeAssignment) {
        await tx.carAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            releasedAt: now,
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Complete work error:", error);
    return { error: error.message || "Failed to complete work." };
  }
}

// Driver reports vehicle issue, marking it OFFLINE
export async function reportVehicleIssue(
  vehicleId: string,
  driverId: string,
  issueDescription: string
) {
  try {
    await db.$transaction(async (tx) => {
      // Set vehicle status to OFFLINE
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "OFFLINE",
          currentDriverId: null,
        },
      });

      // Close active CarAssignment
      const activeAssignment = await tx.carAssignment.findFirst({
        where: {
          driverId,
          vehicleId,
          releasedAt: null,
        },
      });

      if (activeAssignment) {
        await tx.carAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            releasedAt: new Date(),
          },
        });
      }

      // Notify admin
      const admin = await tx.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });

      if (admin) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            message: `Vehicle issue reported, marked OFFLINE: ${issueDescription}`,
            type: "VEHICLE_OFFLINE",
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Report issue error:", error);
    return { error: error.message || "Failed to report vehicle issue." };
  }
}

// Driver completes work and logs trip closing details, parking spot, condition report, and allowance
export async function driverCompleteTripWithDetailsAction(
  tripId: string,
  vehicleId: string,
  driverId: string,
  closingData: {
    startingOdometer: number;
    endingOdometer: number;
    distanceTravelled: number;
    tripAmount: number;
    fuelExpense: number;
    tollExpense: number;
    parkingCharges: number;
    allowance: number;
    otherExpenses: number;
    billsUrl?: string;
    receiptsUrl?: string;
    remarks?: string;
  },
  parkingData: {
    location: string;
    address: string;
    landmark?: string;
    googleMapsLink?: string;
  },
  conditionData: {
    fuelLevel: string;
    tyreCondition: string;
    interiorCondition: string;
    exteriorCondition: string;
    remarks?: string;
  }
) {
  try {
    await db.$transaction(async (tx) => {
      const now = new Date();

      // 1. Get trip start time to calculate duration
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { actualStartTime: true },
      });

      let durationMinutes = 0;
      if (trip?.actualStartTime) {
        const diffMs = now.getTime() - new Date(trip.actualStartTime).getTime();
        durationMinutes = Math.round(diffMs / (1000 * 60));
      }

      // 2. Update trip status to COMPLETED
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          actualEndTime: now,
          durationMinutes,
        },
      });

      // 3. Create TripClosing
      await tx.tripClosing.create({
        data: {
          tripId,
          startingOdometer: closingData.startingOdometer,
          endingOdometer: closingData.endingOdometer,
          distanceTravelled: closingData.distanceTravelled,
          tripAmount: closingData.tripAmount,
          fuelExpense: closingData.fuelExpense,
          tollExpense: closingData.tollExpense,
          parkingCharges: closingData.parkingCharges,
          allowance: closingData.allowance,
          otherExpenses: closingData.otherExpenses,
          billsUrl: closingData.billsUrl || null,
          receiptsUrl: closingData.receiptsUrl || null,
          remarks: closingData.remarks || null,
        },
      });

      // 4. Create ParkingLocation
      await tx.parkingLocation.create({
        data: {
          tripId,
          location: parkingData.location,
          address: parkingData.address,
          landmark: parkingData.landmark || null,
          googleMapsLink: parkingData.googleMapsLink || null,
        },
      });

      // 5. Create VehicleConditionReport
      await tx.vehicleConditionReport.create({
        data: {
          tripId,
          fuelLevel: conditionData.fuelLevel,
          tyreCondition: conditionData.tyreCondition,
          interiorCondition: conditionData.interiorCondition,
          exteriorCondition: conditionData.exteriorCondition,
          remarks: conditionData.remarks || null,
        },
      });

      // 6. Create AdminVerification record as PENDING
      await tx.adminVerification.create({
        data: {
          tripId,
          status: "PENDING",
        },
      });

      // 7. Set driver status to AVAILABLE
      await tx.user.update({
        where: { id: driverId },
        data: {
          status: "AVAILABLE",
        },
      });

      // 8. Set vehicle status to AVAILABLE, update its odometer to the ending odometer, and clear driver (release car)
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "AVAILABLE",
          odometer: closingData.endingOdometer,
          currentDriverId: null,
        },
      });

      // 9. Close CarAssignment
      const activeAssignment = await tx.carAssignment.findFirst({
        where: {
          driverId,
          vehicleId,
          releasedAt: null,
        },
      });

      if (activeAssignment) {
        await tx.carAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            releasedAt: now,
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin/verification");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Complete trip with details error:", error);
    return { error: error.message || "Failed to complete trip with details." };
  }
}

// Update trip closing details, parking spot, condition report for an already completed or in-progress trip
export async function driverUpdateTripDetailsAction(
  tripId: string,
  closingData: {
    startingOdometer: number;
    endingOdometer: number;
    distanceTravelled: number;
    tripAmount: number;
    fuelExpense: number;
    tollExpense: number;
    parkingCharges: number;
    allowance: number;
    otherExpenses: number;
    billsUrl?: string;
    receiptsUrl?: string;
    remarks?: string;
  },
  parkingData: {
    location: string;
    address: string;
    landmark?: string;
    googleMapsLink?: string;
  },
  conditionData: {
    fuelLevel: string;
    tyreCondition: string;
    interiorCondition: string;
    exteriorCondition: string;
    remarks?: string;
  }
) {
  try {
    await db.$transaction(async (tx) => {
      // 1. Upsert TripClosing
      await tx.tripClosing.upsert({
        where: { tripId },
        update: {
          startingOdometer: closingData.startingOdometer,
          endingOdometer: closingData.endingOdometer,
          distanceTravelled: closingData.distanceTravelled,
          fuelExpense: closingData.fuelExpense,
          tollExpense: closingData.tollExpense,
          parkingCharges: closingData.parkingCharges,
          allowance: closingData.allowance,
          otherExpenses: closingData.otherExpenses,
          billsUrl: closingData.billsUrl || null,
          receiptsUrl: closingData.receiptsUrl || null,
          remarks: closingData.remarks || null,
        },
        create: {
          tripId,
          startingOdometer: closingData.startingOdometer,
          endingOdometer: closingData.endingOdometer,
          distanceTravelled: closingData.distanceTravelled,
          tripAmount: closingData.tripAmount,
          fuelExpense: closingData.fuelExpense,
          tollExpense: closingData.tollExpense,
          parkingCharges: closingData.parkingCharges,
          allowance: closingData.allowance,
          otherExpenses: closingData.otherExpenses,
          billsUrl: closingData.billsUrl || null,
          receiptsUrl: closingData.receiptsUrl || null,
          remarks: closingData.remarks || null,
        },
      });

      // 2. Upsert ParkingLocation
      await tx.parkingLocation.upsert({
        where: { tripId },
        update: {
          location: parkingData.location,
          address: parkingData.address,
          landmark: parkingData.landmark || null,
          googleMapsLink: parkingData.googleMapsLink || null,
        },
        create: {
          tripId,
          location: parkingData.location,
          address: parkingData.address,
          landmark: parkingData.landmark || null,
          googleMapsLink: parkingData.googleMapsLink || null,
        },
      });

      // 3. Upsert VehicleConditionReport
      await tx.vehicleConditionReport.upsert({
        where: { tripId },
        update: {
          fuelLevel: conditionData.fuelLevel,
          tyreCondition: conditionData.tyreCondition,
          interiorCondition: conditionData.interiorCondition,
          exteriorCondition: conditionData.exteriorCondition,
          remarks: conditionData.remarks || null,
        },
        create: {
          tripId,
          fuelLevel: conditionData.fuelLevel,
          tyreCondition: conditionData.tyreCondition,
          interiorCondition: conditionData.interiorCondition,
          exteriorCondition: conditionData.exteriorCondition,
          remarks: conditionData.remarks || null,
        },
      });

      // 4. Ensure AdminVerification exists
      const existingVerification = await tx.adminVerification.findUnique({
        where: { tripId },
      });
      if (!existingVerification) {
        await tx.adminVerification.create({
          data: {
            tripId,
            status: "PENDING",
          },
        });
      }

      // 5. Update vehicle odometer
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { vehicleId: true },
      });
      if (trip) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: {
            odometer: closingData.endingOdometer,
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin/verification");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Update trip details error:", error);
    return { error: error.message || "Failed to update trip details." };
  }
}
