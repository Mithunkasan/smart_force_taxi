"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth-utils";

export async function createDriver(data: {
  name: string;
  email: string;
  employeeId: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  joiningDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftDuration: string;
  experience: number;
  shift?: string;
  emergencyContact: string;
  password?: string;
}) {
  try {
    const defaultPassword = data.password || "driverpassword";
    const hashedPassword = hashPassword(defaultPassword);

    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        employeeId: data.employeeId,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        joiningDate: new Date(data.joiningDate),
        shiftStartTime: data.shiftStartTime,
        shiftEndTime: data.shiftEndTime,
        shiftDuration: data.shiftDuration,
        experience: Number(data.experience),
        shift: data.shift || "Morning",
        emergencyContact: data.emergencyContact,
        password: hashedPassword,
        role: "DRIVER",
        status: "OFFLINE",
      },
    });

    revalidatePath("/admin/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("Create driver error:", error);
    return { error: error.message || "Failed to create driver profile" };
  }
}

export async function updateDriver(
  id: string,
  data: {
    name: string;
    email: string;
    employeeId: string;
    phone: string;
    licenseNumber: string;
    licenseExpiry: string;
    joiningDate: string;
    shiftStartTime: string;
    shiftEndTime: string;
    shiftDuration: string;
    experience: number;
    shift?: string;
    emergencyContact: string;
  }
) {
  try {
    await db.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        employeeId: data.employeeId,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        joiningDate: new Date(data.joiningDate),
        shiftStartTime: data.shiftStartTime,
        shiftEndTime: data.shiftEndTime,
        shiftDuration: data.shiftDuration,
        experience: Number(data.experience),
        shift: data.shift || "Morning",
        emergencyContact: data.emergencyContact,
      },
    });

    revalidatePath("/admin/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("Update driver error:", error);
    return { error: error.message || "Failed to update driver profile" };
  }
}

export async function deleteDriver(id: string) {
  try {
    await db.user.delete({
      where: { id },
    });
    revalidatePath("/admin/drivers");
    return { success: true };
  } catch (error: any) {
    console.error("Delete driver error:", error);
    return { error: error.message || "Failed to delete driver" };
  }
}
