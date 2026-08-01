"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function checkInDriver(driverId: string) {
  try {
    const active = await db.attendance.findFirst({
      where: { driverId, checkOut: null },
    });

    if (active) {
      return { error: "Driver is already clocked in." };
    }

    await db.attendance.create({
      data: {
        driverId,
        checkIn: new Date(),
      },
    });

    revalidatePath("/admin/attendance");
    revalidatePath("/driver");
    return { success: true };
  } catch (error: any) {
    console.error("Check in error:", error);
    return { error: error.message || "Failed to check in driver" };
  }
}

export async function checkOutDriver(driverId: string) {
  try {
    const active = await db.attendance.findFirst({
      where: { driverId, checkOut: null },
    });

    if (!active) {
      return { error: "No active check-in record found for this driver." };
    }

    const checkOut = new Date();
    const checkIn = new Date(active.checkIn);
    
    // Calculate difference in decimal hours
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const workingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    
    // Standard Shift is 8 hours
    const overtime = workingHours > 8.0 ? Number((workingHours - 8.0).toFixed(2)) : 0.0;

    await db.attendance.update({
      where: { id: active.id },
      data: {
        checkOut,
        workingHours,
        overtime,
      },
    });

    revalidatePath("/admin/attendance");
    revalidatePath("/driver");
    return { success: true };
  } catch (error: any) {
    console.error("Check out error:", error);
    return { error: error.message || "Failed to check out driver" };
  }
}
