import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DriverIssuesClient } from "@/components/drivers/driver-issues-client";

export const revalidate = 0;

export default async function DriverIssuesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  // Get vehicles currently assigned to this driver
  const vehicles = await db.vehicle.findMany({
    where: {
      currentDriverId: session.user.id,
    },
  });

  return <DriverIssuesClient vehicles={vehicles} driverId={session.user.id} />;
}
