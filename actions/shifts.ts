"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VehicleStatus, DriverStatus } from "@prisma/client";

// Driver starts shift
export async function startDriverShiftAction(driverId: string) {
  try {
    const driver = await db.user.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.role !== "DRIVER") {
      return { error: "Driver profile not found." };
    }

    // Check if driver already has an active shift
    const activeShift = await db.driverShift.findFirst({
      where: {
        driverId,
        actualEnd: null,
      },
    });

    if (activeShift) {
      return { error: "You already have an active running shift." };
    }

    const todayDateStr = new Date().toISOString().split("T")[0];

    await db.$transaction(async (tx) => {
      // Create shift record
      await tx.driverShift.create({
        data: {
          driverId,
          date: todayDateStr,
          shiftStart: driver.shiftStartTime || "06:00 AM",
          shiftEnd: driver.shiftEndTime || "06:00 PM",
          duration: driver.shiftDuration || "12 Hours",
          actualStart: new Date(),
        },
      });

      // Update driver status to AVAILABLE
      await tx.user.update({
        where: { id: driverId },
        data: {
          status: "AVAILABLE",
        },
      });

      // Notification for admin
      const admin = await tx.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });

      if (admin) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            message: `Driver ${driver.name} has started their shift (${driver.shiftStartTime || "06:00 AM"} - ${driver.shiftEndTime || "06:00 PM"}).`,
            type: "SHIFT_STARTED",
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Start shift error:", error);
    return { error: error.message || "Failed to start shift." };
  }
}

// Driver ends shift
export async function endDriverShiftAction(driverId: string) {
  try {
    // Find active shift
    const activeShift = await db.driverShift.findFirst({
      where: {
        driverId,
        actualEnd: null,
      },
    });

    const assignedVehicle = await db.vehicle.findFirst({
      where: {
        currentDriverId: driverId,
      },
    });

    await db.$transaction(async (tx) => {
      // End shift log
      if (activeShift) {
        await tx.driverShift.update({
          where: { id: activeShift.id },
          data: {
            actualEnd: new Date(),
          },
        });
      }

      // Update driver status to OFFLINE
      await tx.user.update({
        where: { id: driverId },
        data: {
          status: "OFFLINE",
        },
      });

      // Release vehicle if assigned
      if (assignedVehicle) {
        await tx.vehicle.update({
          where: { id: assignedVehicle.id },
          data: {
            currentDriverId: null,
            status: "AVAILABLE",
          },
        });

        // Set CarAssignment releasedAt
        const activeAssignment = await tx.carAssignment.findFirst({
          where: {
            driverId,
            vehicleId: assignedVehicle.id,
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
      }
    });

    revalidatePath("/driver");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("End shift error:", error);
    return { error: error.message || "Failed to end shift." };
  }
}

// Driver picks an available car
export async function pickVehicleAction(driverId: string, vehicleId: string) {
  try {
    // 1. Fetch vehicle & check availability
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return { error: "Vehicle not found." };
    }

    if (vehicle.status !== "AVAILABLE" || vehicle.currentDriverId) {
      return { error: "This vehicle is not available." };
    }

    // 2. Fetch driver and check status
    const driver = await db.user.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.status === "OFFLINE") {
      return { error: "You must start your shift before picking a vehicle." };
    }

    // Check if driver already has an assigned vehicle
    const alreadyAssigned = await db.vehicle.findFirst({
      where: { currentDriverId: driverId },
    });

    if (alreadyAssigned) {
      return { error: "You already have a vehicle assigned. Please release it first." };
    }

    await db.$transaction(async (tx) => {
      // Update vehicle to ASSIGNED
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "ASSIGNED",
          currentDriverId: driverId,
        },
      });

      // Create CarAssignment record
      await tx.carAssignment.create({
        data: {
          driverId,
          vehicleId,
          assignedAt: new Date(),
        },
      });

      // Notify admin
      const admin = await tx.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });

      if (admin) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            message: `Driver ${driver.name} assigned vehicle ${vehicle.vehicleNumber} to themselves.`,
            type: "VEHICLE_ASSIGNED",
          },
        });
      }
    });

    revalidatePath("/driver");
    revalidatePath("/driver/available-vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Pick vehicle error:", error);
    return { error: error.message || "Failed to pick vehicle." };
  }
}

// Driver releases vehicle
export async function releaseVehicleAction(driverId: string, vehicleId: string) {
  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.currentDriverId !== driverId) {
      return { error: "Vehicle is not assigned to you." };
    }

    await db.$transaction(async (tx) => {
      // Update vehicle to AVAILABLE
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "AVAILABLE",
          currentDriverId: null,
        },
      });

      // Close CarAssignment
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
    });

    revalidatePath("/driver");
    revalidatePath("/driver/available-vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Release vehicle error:", error);
    return { error: error.message || "Failed to release vehicle." };
  }
}
