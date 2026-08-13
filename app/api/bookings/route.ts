import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/bookings?vehicleId=xxx&date=YYYY-MM-DD
 * Returns live active bookings for a given vehicle (not CANCELLED/COMPLETED).
 * Used by the driver dashboard to poll for real-time slot availability.
 */
export const GET = auth(async (req) => {
  if (!req.auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    if (!vehicleId) {
      return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });
    }

    const bookings = await db.trip.findMany({
      where: {
        vehicleId,
        status: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[API/bookings] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
