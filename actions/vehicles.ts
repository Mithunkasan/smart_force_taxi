"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VehicleStatus } from "@prisma/client";

export async function createVehicle(data: {
  vehicleNumber: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  seatingCapacity: number;
  registrationNumber: string;
  insuranceExpiry: string;
  fcExpiry: string;
  pollutionExpiry: string;
  serviceDueDate: string;
  odometer: number;
  status: VehicleStatus;
  carType?: string;
  ownershipType?: string;
  notes?: string;
}) {
  try {
    await db.vehicle.create({
      data: {
        vehicleNumber: data.vehicleNumber,
        name: data.name,
        brand: data.brand,
        model: data.model,
        year: Number(data.year),
        seatingCapacity: Number(data.seatingCapacity),
        registrationNumber: data.registrationNumber,
        insuranceExpiry: new Date(data.insuranceExpiry),
        fcExpiry: new Date(data.fcExpiry),
        pollutionExpiry: new Date(data.pollutionExpiry),
        serviceDueDate: new Date(data.serviceDueDate),
        odometer: Number(data.odometer),
        status: data.status,
        carType: data.carType || null,
        ownershipType: data.ownershipType || null,
        notes: data.notes || null,
      },
    });
    revalidatePath("/admin/vehicles");
    revalidatePath("/driver/available-vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Create vehicle error:", error);
    return { error: error.message || "Failed to create vehicle" };
  }
}

export async function updateVehicle(
  id: string,
  data: {
    vehicleNumber: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    seatingCapacity: number;
    registrationNumber: string;
    insuranceExpiry: string;
    fcExpiry: string;
    pollutionExpiry: string;
    serviceDueDate: string;
    odometer: number;
    status: VehicleStatus;
    carType?: string;
    ownershipType?: string;
    notes?: string;
  }
) {
  try {
    await db.vehicle.update({
      where: { id },
      data: {
        vehicleNumber: data.vehicleNumber,
        name: data.name,
        brand: data.brand,
        model: data.model,
        year: Number(data.year),
        seatingCapacity: Number(data.seatingCapacity),
        registrationNumber: data.registrationNumber,
        insuranceExpiry: new Date(data.insuranceExpiry),
        fcExpiry: new Date(data.fcExpiry),
        pollutionExpiry: new Date(data.pollutionExpiry),
        serviceDueDate: new Date(data.serviceDueDate),
        odometer: Number(data.odometer),
        status: data.status,
        carType: data.carType || null,
        ownershipType: data.ownershipType || null,
        notes: data.notes || null,
      },
    });
    revalidatePath("/admin/vehicles");
    revalidatePath("/driver/available-vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Update vehicle error:", error);
    return { error: error.message || "Failed to update vehicle" };
  }
}

export async function deleteVehicle(id: string) {
  try {
    await db.vehicle.delete({
      where: { id },
    });
    revalidatePath("/admin/vehicles");
    revalidatePath("/driver/available-vehicles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete vehicle error:", error);
    return { error: error.message || "Failed to delete vehicle" };
  }
}

export async function assignVehicleToDriver(vehicleId: string, driverId: string | null) {
  try {
    if (driverId) {
      // Clear any other vehicle assigned to this driver
      await db.vehicle.updateMany({
        where: { assignedDriverId: driverId },
        data: { assignedDriverId: null },
      });
    }

    // Assign the selected vehicle
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { assignedDriverId: driverId },
    });

    revalidatePath("/admin/drivers");
    revalidatePath("/driver");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Assign vehicle to driver error:", error);
    return { error: error.message || "Failed to assign vehicle." };
  }
}
