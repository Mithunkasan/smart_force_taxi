"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VerificationStatus } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function verifyTripData(
  tripId: string,
  status: VerificationStatus,
  remarks: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Update AdminVerification record
    await db.adminVerification.update({
      where: { tripId },
      data: {
        status,
        remarks,
        verifiedById: session.user.id,
      },
      include: {
        trip: {
          include: {
            driver: true,
          },
        },
      },
    });

    // Create a notification for the driver regarding the verification status
    const verification = await db.adminVerification.findUnique({
      where: { tripId },
      include: {
        trip: true,
      },
    });

    if (verification && verification.trip.driverId) {
      await db.notification.create({
        data: {
          userId: verification.trip.driverId,
          message: `Your trip closing for ${verification.trip.tripNumber} was marked as ${status}. Remarks: ${remarks || "None"}`,
          type: "VERIFICATION_COMPLETED",
        },
      });
    }

    revalidatePath("/admin/verification");
    revalidatePath("/admin");
    revalidatePath("/driver/trip");
    return { success: true };
  } catch (error: any) {
    console.error("Verification error:", error);
    return { error: error.message || "Failed to submit verification status" };
  }
}
