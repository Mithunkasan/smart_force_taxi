"use client";

import React, { useEffect, useState } from "react";
import { useDriverTab } from "./driver-portal-context";
import { DriverDashboardClient } from "./driver-dashboard-client";
import { AvailableVehiclesClient } from "./available-vehicles-client";
import { WeeklyLogClient } from "./weekly-log-client";
import { User, Vehicle, Trip, WeeklyLog } from "@prisma/client";

interface DriverPortalClientProps {
  driver: User;
  activeShift: any | null;
  assignedVehicle: Vehicle | null;
  vehicles: Vehicle[];
  bookings: (Trip & { driver?: User | null; vehicle?: Vehicle | null })[];
  activeTrip: (Trip & { vehicle: Vehicle }) | null;
  logs: WeeklyLog[];
}

export function DriverPortalClient({
  driver,
  activeShift,
  assignedVehicle,
  vehicles,
  bookings,
  activeTrip,
  logs,
}: DriverPortalClientProps) {
  const { activeTab } = useDriverTab();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid layout shifts or hydrations mismatches by displaying initial server view shell
    return (
      <div className="mx-auto max-w-7xl w-full py-8 text-center text-muted-foreground animate-pulse">
        Loading Driver Portal...
      </div>
    );
  }

  return (
    <>
      <div className={activeTab === "dashboard" ? "block" : "hidden"}>
        <DriverDashboardClient
          driver={driver}
          activeShift={activeShift}
          assignedVehicle={assignedVehicle}
          vehicles={vehicles}
          bookings={bookings}
          activeTrip={activeTrip}
        />
      </div>
      <div className={activeTab === "vehicles" ? "block" : "hidden"}>
        <AvailableVehiclesClient
          vehicles={vehicles.filter((v) => v.status === "AVAILABLE")}
          bookings={bookings}
          currentUserId={driver.id}
          currentUserRole="DRIVER"
          currentUserName={driver.name}
        />
      </div>
      <div className={activeTab === "weekly-log" ? "block" : "hidden"}>
        <WeeklyLogClient
          driver={driver}
          initialLogs={logs}
        />
      </div>
    </>
  );
}
