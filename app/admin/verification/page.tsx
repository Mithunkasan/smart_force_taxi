import React from "react";
import { db } from "@/lib/db";
import { VerificationManagerClient } from "@/components/verification/verification-manager-client";

export const revalidate = 0;

export default async function VerificationPage() {
  // Query all trips that have trip closing submissions
  const trips = await db.trip.findMany({
    where: {
      closing: {
        isNot: null,
      },
    },
    include: {
      driver: true,
      vehicle: true,
      closing: true,
      conditionReport: true,
      parking: true,
      verification: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return <VerificationManagerClient trips={trips} />;
}
