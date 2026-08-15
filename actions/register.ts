"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";
import { sendDriverRegistrationEmail, sendDriverRegistrationWhatsApp } from "@/lib/notifications";

export async function registerUser(data: {
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  shift?: string;
  emergencyContact: string;
  password?: string;
}) {
  try {
    if (!data.name || !data.email || !data.password) {
      return { error: "Name, email, and password are required fields." };
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { error: "An account with this email address already exists." };
    }

    // Auto-generate a unique employee ID
    let employeeId = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const rand = Math.floor(10000 + Math.random() * 90000);
      employeeId = `SF-DRV-${rand}`;
      const existingEmp = await db.user.findUnique({
        where: { employeeId },
      });
      if (!existingEmp) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return { error: "Failed to generate a unique employee ID. Please try again." };
    }

    const hashedPassword = hashPassword(data.password);

    await db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        employeeId: employeeId,
        phone: data.phone || null,
        licenseNumber: data.licenseNumber || null,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
        experience: data.experience ? Number(data.experience) : null,
        shift: data.shift || "Morning",
        emergencyContact: data.emergencyContact || null,
        password: hashedPassword,
        role: "DRIVER", // Default self-registered role
      },
    });

    // Send email credentials notification
    await sendDriverRegistrationEmail(
      data.email.toLowerCase().trim(),
      data.name,
      employeeId,
      data.password
    );

    // Send WhatsApp credentials notification
    if (data.phone) {
      await sendDriverRegistrationWhatsApp(
        data.phone,
        data.name,
        data.email.toLowerCase().trim(),
        data.password
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("Self-registration error:", error);
    return { error: error.message || "Failed to register account" };
  }
}
