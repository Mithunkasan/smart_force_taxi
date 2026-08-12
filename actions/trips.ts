"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TripStatus, Priority } from "@prisma/client";
import { sendBookingCancellationEmail } from "@/lib/notifications";

export async function createTrip(data: {
  tripNumber: string;
  pickup: string;
  destination: string;
  startTime: string;
  endTime: string;
  purpose: string;
  priority: Priority;
  driverId: string;
  vehicleId: string;
  notes?: string;
  startGpsUrl?: string;
  destinationGpsUrl?: string;
}) {
  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { error: "End time must be after start time." };
    }

    // Validate driver status
    const driver = await db.user.findUnique({
      where: { id: data.driverId },
    });

    if (!driver || driver.status === "OFFLINE") {
      return { error: "Selected driver is currently offline or has not started their shift." };
    }

    // Verify driver does not already have an active/assigned work
    const activeTrip = await db.trip.findFirst({
      where: {
        driverId: data.driverId,
        status: {
          in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"],
        },
      },
    });

    if (activeTrip) {
      return { error: "Selected driver already has an active work assignment." };
    }

    // Validate vehicle availability
    const vehicle = await db.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle || (vehicle.status !== "AVAILABLE" && vehicle.currentDriverId !== data.driverId)) {
      return { error: "Selected vehicle is not available (must be AVAILABLE or already picked by driver)." };
    }

    // Create the trip in ASSIGNED status (assigned by ADMIN)
    await db.$transaction(async (tx) => {
      await tx.trip.create({
        data: {
          tripNumber: data.tripNumber,
          pickup: data.pickup,
          destination: data.destination,
          startTime: start,
          endTime: end,
          purpose: data.purpose,
          priority: data.priority,
          status: "ASSIGNED",
          notes: data.notes || null,
          startGpsUrl: data.startGpsUrl || null,
          destinationGpsUrl: data.destinationGpsUrl || null,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          assignedBy: "ADMIN",
          requestedBy: "ADMIN",
          department: "Operations",
        },
      });

      // Update vehicle to ASSIGNED to driver (if not already)
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: {
          status: "ASSIGNED",
          currentDriverId: data.driverId,
        },
      });

      // Add a history record if not already assigned
      const assignmentExists = await tx.carAssignment.findFirst({
        where: {
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          releasedAt: null,
        },
      });

      if (!assignmentExists) {
        await tx.carAssignment.create({
          data: {
            driverId: data.driverId,
            vehicleId: data.vehicleId,
            assignedAt: new Date(),
          },
        });
      }

      // Notify the driver
      await tx.notification.create({
        data: {
          userId: data.driverId,
          message: `Admin assigned new work to you: ${data.pickup} to ${data.destination}. Please accept it on your dashboard.`,
          type: "VEHICLE_ASSIGNMENT",
        },
      });
    });

    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    revalidatePath("/driver");
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
    pickup: string;
    destination: string;
    startTime: string;
    endTime: string;
    purpose: string;
    priority: Priority;
    driverId: string | null;
    vehicleId: string;
    status: TripStatus;
    notes?: string;
    startGpsUrl?: string;
    destinationGpsUrl?: string;
  }
) {
  try {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { error: "End time must be after start time." };
    }

    // Update trip details
    await db.$transaction(async (tx) => {
      const oldTrip = await tx.trip.findUnique({
        where: { id },
      });

      await tx.trip.update({
        where: { id },
        data: {
          tripNumber: data.tripNumber,
          pickup: data.pickup,
          destination: data.destination,
          startTime: start,
          endTime: end,
          purpose: data.purpose,
          priority: data.priority,
          status: data.status,
          driverId: data.driverId || null,
          vehicleId: data.vehicleId,
          notes: data.notes || null,
          startGpsUrl: data.startGpsUrl || null,
          destinationGpsUrl: data.destinationGpsUrl || null,
        },
      });

      // If status is changed by admin to CANCELLED or COMPLETED, manage vehicle status
      if (data.status === "CANCELLED" || data.status === "COMPLETED") {
        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: {
            status: "AVAILABLE",
            currentDriverId: null,
          },
        });

        // Trigger email notification to driver on cancellation
        if (data.status === "CANCELLED" && data.driverId) {
          const driverUser = await tx.user.findUnique({ where: { id: data.driverId } });
          const vehicleObj = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
          if (driverUser?.email && vehicleObj) {
            await sendBookingCancellationEmail(
              driverUser.email,
              driverUser.name,
              data.tripNumber,
              vehicleObj.name,
              start,
              end
            );
          }
        }

        if (data.driverId) {
          await tx.user.update({
            where: { id: data.driverId },
            data: { status: "AVAILABLE" },
          });

          // Close assignment
          const activeAssignment = await tx.carAssignment.findFirst({
            where: {
              driverId: data.driverId,
              vehicleId: data.vehicleId,
              releasedAt: null,
            },
          });

          if (activeAssignment) {
            await tx.carAssignment.update({
              where: { id: activeAssignment.id },
              data: { releasedAt: new Date() },
            });
          }
        }
      }
    });

    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    revalidatePath("/driver");
    return { success: true };
  } catch (error: any) {
    console.error("Update trip error:", error);
    return { error: error.message || "Failed to update trip" };
  }
}

export async function deleteTrip(id: string) {
  try {
    await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
        include: { driver: true, vehicle: true },
      });

      if (trip && trip.status !== "COMPLETED" && trip.status !== "CANCELLED") {
        // Send email cancellation notice
        if (trip.driver?.email && trip.vehicle) {
          await sendBookingCancellationEmail(
            trip.driver.email,
            trip.driver.name,
            trip.tripNumber,
            trip.vehicle.name,
            trip.startTime,
            trip.endTime
          );
        }
        // Release vehicle
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: {
            status: "AVAILABLE",
            currentDriverId: null,
          },
        });

        if (trip.driverId) {
          await tx.user.update({
            where: { id: trip.driverId },
            data: { status: "AVAILABLE" },
          });

          // Close active CarAssignment
          const activeAssignment = await tx.carAssignment.findFirst({
            where: {
              driverId: trip.driverId,
              vehicleId: trip.vehicleId,
              releasedAt: null,
            },
          });

          if (activeAssignment) {
            await tx.carAssignment.update({
              where: { id: activeAssignment.id },
              data: { releasedAt: new Date() },
            });
          }
        }
      }

      await tx.trip.delete({
        where: { id },
      });
    });

    revalidatePath("/admin/trips");
    revalidatePath("/admin");
    revalidatePath("/driver");
    return { success: true };
  } catch (error: any) {
    console.error("Delete trip error:", error);
    return { error: error.message || "Failed to delete trip" };
  }
}
