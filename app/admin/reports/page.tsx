import React from "react";
import { db } from "@/lib/db";
import { ReportsManagerClient } from "@/components/reports/reports-manager-client";

export const revalidate = 0;

export default async function ReportsPage() {
  // 1. Calculate financials
  const revAgg = await db.tripClosing.aggregate({
    _sum: { tripAmount: true },
  });
  const totalRevenue = revAgg._sum.tripAmount || 0;

  const fuelAgg = await db.fuelLog.aggregate({
    _sum: { cost: true },
  });
  const totalFuel = fuelAgg._sum.cost || 0;

  const maintAgg = await db.maintenance.aggregate({
    _sum: { repairCost: true },
  });
  const totalMaintenance = maintAgg._sum.repairCost || 0;
  const netMargin = totalRevenue - totalFuel - totalMaintenance;

  // 2. Fetch Vehicle Usage Stats
  const vehicles = await db.vehicle.findMany({
    include: {
      trips: {
        select: { id: true },
      },
    },
    orderBy: { odometer: "desc" },
  });
  const vehicleUsage = vehicles.map((v) => ({
    vehicleNumber: v.vehicleNumber,
    name: v.name,
    brand: v.brand,
    model: v.model,
    distance: v.odometer,
    tripsCount: v.trips.length,
    status: v.status,
  }));

  // 3. Fetch Driver Performance Stats
  const drivers = await db.user.findMany({
    where: { role: "DRIVER" },
    include: {
      attendance: {
        select: { workingHours: true, overtime: true },
      },
      trips: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });
  const driverPerformance = drivers.map((d) => {
    const workingHours = d.attendance.reduce((sum, current) => sum + current.workingHours, 0);
    const overtime = d.attendance.reduce((sum, current) => sum + current.overtime, 0);
    return {
      employeeId: d.employeeId || "",
      name: d.name,
      workingHours: Number(workingHours.toFixed(2)),
      overtime: Number(overtime.toFixed(2)),
      tripsCount: d.trips.length,
    };
  });

  // 4. Fetch Fuel Logs
  const fuelList = await db.fuelLog.findMany({
    include: {
      vehicle: { select: { vehicleNumber: true } },
      driver: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
  const fuelLogs = fuelList.map((f) => ({
    date: new Date(f.date).toLocaleDateString(),
    vehicleNumber: f.vehicle.vehicleNumber,
    driverName: f.driver.name,
    quantity: f.quantity,
    cost: f.cost,
    mileage: f.mileage,
  }));

  // 5. Fetch Maintenance Logs
  const maintList = await db.maintenance.findMany({
    include: {
      vehicle: { select: { vehicleNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const maintenanceLogs = maintList.map((m) => ({
    vehicleNumber: m.vehicle.vehicleNumber,
    serviceHistory: m.serviceHistory,
    cost: m.repairCost,
    garage: m.garageDetails,
    date: new Date(m.createdAt).toLocaleDateString(),
  }));

  return (
    <ReportsManagerClient
      financialStats={{ totalRevenue, totalFuel, totalMaintenance, netMargin }}
      vehicleUsage={vehicleUsage}
      driverPerformance={driverPerformance}
      fuelLogs={fuelLogs}
      maintenanceLogs={maintenanceLogs}
    />
  );
}
