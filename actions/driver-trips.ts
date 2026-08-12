"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TripStatus, Priority } from "@prisma/client";

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
    // Fetch the trip booking
    const trip = await db.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return { error: "Trip booking record not found." };
    }

    const now = new Date();
    // Enforce scheduled start time
    if (now < new Date(trip.startTime)) {
      return { 
        error: `Cannot start trip before the scheduled start time (${new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).` 
      };
    }

    await db.$transaction(async (tx) => {
      // 1. Update trip status to IN_PROGRESS
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "IN_PROGRESS",
          actualStartTime: now,
        },
      });

      // 2. Set driver status to ON_TRIP
      const driver = await tx.user.update({
        where: { id: driverId },
        data: {
          status: "ON_TRIP",
        },
      });

      // 3. Set vehicle status to ON_TRIP and set currentDriverId to driverId
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "ON_TRIP",
          currentDriverId: driverId,
        },
      });

      // 4. Create a CarAssignment record if not already assigned
      const assignmentExists = await tx.carAssignment.findFirst({
        where: {
          driverId,
          vehicleId,
          releasedAt: null,
        },
      });

      if (!assignmentExists) {
        await tx.carAssignment.create({
          data: {
            driverId,
            vehicleId,
            assignedAt: now,
          },
        });
      }

      // 5. Automatically create a DriverShift record (clock in)
      const activeShift = await tx.driverShift.findFirst({
        where: {
          driverId,
          actualEnd: null,
        },
      });

      if (!activeShift && driver) {
        const todayDateStr = now.toISOString().split("T")[0];
        await tx.driverShift.create({
          data: {
            driverId,
            date: todayDateStr,
            shiftStart: driver.shiftStartTime || "06:00 AM",
            shiftEnd: driver.shiftEndTime || "06:00 PM",
            duration: driver.shiftDuration || "12 Hours",
            actualStart: now,
          },
        });
      }
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

      // 6. Automatically close DriverShift (clock out)
      const activeShift = await tx.driverShift.findFirst({
        where: {
          driverId,
          actualEnd: null,
        },
      });

      if (activeShift) {
        await tx.driverShift.update({
          where: { id: activeShift.id },
          data: {
            actualEnd: now,
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

      // 10. Automatically close DriverShift (clock out)
      const activeShift = await tx.driverShift.findFirst({
        where: {
          driverId,
          actualEnd: null,
        },
      });

      if (activeShift) {
        await tx.driverShift.update({
          where: { id: activeShift.id },
          data: {
            actualEnd: now,
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

      // 6. Create Notification for the driver
      if (data.assignedBy === "ADMIN") {
        await tx.notification.create({
          data: {
            userId: data.driverId,
            message: `Admin assigned vehicle ${vehicle.vehicleNumber} for you from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            type: "VEHICLE_ASSIGNMENT",
          },
        });
      } else {
        await tx.notification.create({
          data: {
            userId: data.driverId,
            message: `You successfully booked vehicle ${vehicle.vehicleNumber} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            type: "VEHICLE_ASSIGNED",
          },
        });

        // Notify super admin
        const admin = await tx.user.findFirst({
          where: { role: "SUPER_ADMIN" },
          select: { id: true },
        });
        if (admin) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              message: `Driver successfully booked vehicle ${vehicle.vehicleNumber} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              type: "SHIFT_STARTED",
            },
          });
        }
      }
    });

    revalidatePath("/driver");
    revalidatePath("/driver/trip");
    revalidatePath("/admin/trips");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Book car action error:", error);
    return { error: error.message || "Failed to book vehicle." };
  }
}
