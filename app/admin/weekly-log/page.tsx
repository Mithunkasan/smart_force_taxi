import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WeeklyLogAdminClient } from "@/components/drivers/weekly-log-admin-client";

export const revalidate = 0;

export default async function AdminWeeklyLogPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "TRANSPORT_MANAGER")) {
    redirect("/login");
  }

  const logs = await db.weeklyLog.findMany({
    include: {
      driver: true,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });

  return <WeeklyLogAdminClient initialLogs={logs} />;
}
