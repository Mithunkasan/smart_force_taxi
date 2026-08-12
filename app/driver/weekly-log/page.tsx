import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WeeklyLogClient } from "@/components/drivers/weekly-log-client";

export const revalidate = 0;

export default async function WeeklyLogPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const driver = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!driver) {
    redirect("/login");
  }

  const logs = await db.weeklyLog.findMany({
    where: { driverId: driver.id },
    orderBy: { uploadedAt: "desc" },
  });

  return <WeeklyLogClient driver={driver} initialLogs={logs} />;
}
