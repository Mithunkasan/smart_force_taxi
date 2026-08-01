"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function logFuel(data: {
  vehicleId: string;
  driverId: string;
  quantity: number;
  cost: number;
  odometer: number;
}) {
  try {
    const vehicle = await db.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      return { error: "Vehicle not found" };
    }

    if (data.odometer < vehicle.odometer) {
      return { error: `Submitted odometer (${data.odometer} km) cannot be less than the current vehicle odometer (${vehicle.odometer} km).` };
    }

    // Calculate mileage: distance traveled since last recorded odometer / quantity
    const distance = data.odometer - vehicle.odometer;
    let mileage = 12.0; // Default standard fallback mileage
    if (distance > 0 && data.quantity > 0) {
      mileage = Number((distance / data.quantity).toFixed(2));
    }

    // Create fuel log
    await db.fuelLog.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        quantity: Number(data.quantity),
        cost: Number(data.cost),
        mileage,
        date: new Date(),
      },
    });

    // Sync odometer back to vehicle record
    await db.vehicle.update({
      where: { id: data.vehicleId },
      data: { odometer: Number(data.odometer) },
    });

    revalidatePath("/admin/fuel");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Log fuel error:", error);
    return { error: error.message || "Failed to log fuel refuel event" };
  }
}

export async function deleteFuelLog(id: string) {
  try {
    await db.fuelLog.delete({
      where: { id },
    });
    revalidatePath("/admin/fuel");
    return { success: true };
  } catch (error: any) {
    console.error("Delete fuel error:", error);
    return { error: error.message || "Failed to delete fuel log" };
  }
}
