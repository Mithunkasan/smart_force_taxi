"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function logMaintenance(data: {
  vehicleId: string;
  serviceHistory: string;
  nextServiceDate: string;
  oilChangeDone: boolean;
  tyresChanged: boolean;
  batteryChanged: boolean;
  repairCost: number;
  garageDetails: string;
}) {
  try {
    // Create maintenance record
    await db.maintenance.create({
      data: {
        vehicleId: data.vehicleId,
        serviceHistory: data.serviceHistory,
        nextServiceDate: new Date(data.nextServiceDate),
        oilChangeDone: data.oilChangeDone,
        tyresChanged: data.tyresChanged,
        batteryChanged: data.batteryChanged,
        repairCost: Number(data.repairCost),
        garageDetails: data.garageDetails,
      },
    });

    // Update vehicle's service due date and status
    await db.vehicle.update({
      where: { id: data.vehicleId },
      data: {
        serviceDueDate: new Date(data.nextServiceDate),
        status: "MAINTENANCE", // Send vehicle to workshop
      },
    });

    revalidatePath("/admin/maintenance");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Log maintenance error:", error);
    return { error: error.message || "Failed to log maintenance record" };
  }
}

export async function completeMaintenance(id: string, vehicleId: string) {
  try {
    // Bring vehicle back to available status
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { status: "AVAILABLE" },
    });

    revalidatePath("/admin/maintenance");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Complete maintenance error:", error);
    return { error: error.message || "Failed to complete maintenance" };
  }
}

export async function deleteMaintenance(id: string) {
  try {
    await db.maintenance.delete({
      where: { id },
    });
    revalidatePath("/admin/maintenance");
    return { success: true };
  } catch (error: any) {
    console.error("Delete maintenance error:", error);
    return { error: error.message || "Failed to delete maintenance log" };
  }
}
