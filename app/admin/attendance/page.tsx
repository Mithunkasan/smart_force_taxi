import React from "react";
import { db } from "@/lib/db";
import { AttendanceManagerClient } from "@/components/attendance/attendance-manager-client";

export const revalidate = 0;

export default async function AttendancePage() {
  const attendanceLogs = await db.attendance.findMany({
    include: {
      driver: true,
    },
    orderBy: {
      checkIn: "desc",
    },
    take: 50, // Display recent 50 logs
  });

  const drivers = await db.user.findMany({
    where: {
      role: "DRIVER",
    },
    orderBy: {
      name: "asc",
    },
  });

  return <AttendanceManagerClient attendanceLogs={attendanceLogs} drivers={drivers} />;
}
