import React from "react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import {
  Truck,
  Users,
  Route,
  FileCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
} from "lucide-react";

export const revalidate = 0; // Disable caching to fetch live db values

export default async function AdminDashboard() {
  // 1. Vehicle counts
  const totalVehicles = await db.vehicle.count();
  const availableVehicles = await db.vehicle.count({ where: { status: "AVAILABLE" } });
  const tripVehicles = await db.vehicle.count({ where: { status: "ON_TRIP" } });
  const maintenanceVehicles = await db.vehicle.count({ where: { status: "MAINTENANCE" } });
  const breakdownVehicles = await db.vehicle.count({ where: { status: "BREAKDOWN" } });

  // 2. Driver counts
  const totalDrivers = await db.user.count({ where: { role: "DRIVER" } });
  
  // Drivers On duty (have an active trip status 'STARTED')
  const activeTrips = await db.trip.findMany({
    where: { status: "STARTED" },
    select: { driverId: true },
  });
  const activeDriverIds = Array.from(new Set(activeTrips.map((t) => t.driverId).filter((id): id is string => id !== null)));
  const driversOnDuty = activeDriverIds.length;
  const driversAvailable = Math.max(0, totalDrivers - driversOnDuty);

  // 3. Trip counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTrips = await db.trip.count({
    where: {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  const upcomingTrips = await db.trip.count({
    where: {
      startTime: {
        gte: tomorrow,
      },
      status: {
        in: ["APPROVED", "ASSIGNED", "PENDING"],
      },
    },
  });

  const pendingVerifications = await db.adminVerification.count({
    where: { status: "PENDING" },
  });

  // 4. Financial totals
  const revenueAgg = await db.tripClosing.aggregate({
    _sum: { tripAmount: true },
  });
  const totalRevenue = revenueAgg._sum.tripAmount || 0;

  const fuelAgg = await db.fuelLog.aggregate({
    _sum: { cost: true },
  });
  const totalFuelCost = fuelAgg._sum.cost || 0;

  const maintenanceAgg = await db.maintenance.aggregate({
    _sum: { repairCost: true },
  });
  const totalMaintenanceCost = maintenanceAgg._sum.repairCost || 0;

  // 5. Build dynamic monthly financial overview (past 6 months)
  const monthlyFinancials = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const rev = await db.tripClosing.aggregate({
      _sum: { tripAmount: true },
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const fuel = await db.fuelLog.aggregate({
      _sum: { cost: true },
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const maint = await db.maintenance.aggregate({
      _sum: { repairCost: true },
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    monthlyFinancials.push({
      name: d.toLocaleString("default", { month: "short" }),
      Revenue: rev._sum.tripAmount || 0,
      Fuel: fuel._sum.cost || 0,
      Maintenance: maint._sum.repairCost || 0,
    });
  }

  // 6. Build vehicle status distribution for pie chart
  const vehicleStatusDistribution = [
    { name: "AVAILABLE", value: availableVehicles, color: "#22c55e" },
    { name: "ASSIGNED", value: totalVehicles - availableVehicles - tripVehicles - maintenanceVehicles - breakdownVehicles, color: "#3b82f6" },
    { name: "ON TRIP", value: tripVehicles, color: "#a855f7" },
    { name: "MAINTENANCE", value: maintenanceVehicles, color: "#eab308" },
    { name: "BREAKDOWN", value: breakdownVehicles, color: "#dc2626" },
  ].filter((item) => item.value > 0);

  // 7. Fetch recent notifications
  const recentActivities = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Real-time metrics, fleet tracking diagnostics, and operational logs.
        </p>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Vehicles Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Vehicles</p>
              <h3 className="text-2xl font-bold">{totalVehicles}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-green-500 font-semibold">{availableVehicles}</span> Available ·{" "}
                <span className="text-purple-500 font-semibold">{tripVehicles}</span> On Trip
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Drivers</p>
              <h3 className="text-2xl font-bold">{totalDrivers}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-green-500 font-semibold">{driversAvailable}</span> Available ·{" "}
                <span className="text-blue-500 font-semibold">{driversOnDuty}</span> On Duty
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trips Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3 text-green-500">
              <Route className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Trips Summary</p>
              <h3 className="text-2xl font-bold">{todayTrips + upcomingTrips}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-foreground font-semibold">{todayTrips}</span> Today ·{" "}
                <span className="text-muted-foreground font-semibold">{upcomingTrips}</span> Upcoming
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-yellow-500/10 p-3 text-yellow-500">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Verifications</p>
              <h3 className="text-2xl font-bold">{pendingVerifications}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-yellow-500 font-semibold">{pendingVerifications}</span> Pending admin review
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financials Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-gradient-to-tr from-green-50 to-white dark:from-green-950/10 dark:to-zinc-900 border-green-500/10 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Gross Revenue</p>
              <h3 className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </Card>

        <Card className="border-border bg-gradient-to-tr from-yellow-50 to-white dark:from-yellow-950/10 dark:to-zinc-900 border-yellow-500/10 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Fuel Expenses</p>
              <h3 className="text-xl font-bold mt-1 text-yellow-600 dark:text-yellow-500">
                ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
        </Card>

        <Card className="border-border bg-gradient-to-tr from-red-50 to-white dark:from-red-950/10 dark:to-zinc-900 border-red-500/10 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Maintenance Expenses</p>
              <h3 className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">
                ${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts */}
      <DashboardCharts
        financialData={monthlyFinancials}
        vehicleStatusData={vehicleStatusDistribution}
      />

      {/* Recent Activity Section */}
      <Card className="border-border glass glow-primary">
        <div className="p-6">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Fleet Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx !== recentActivities.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-8 ring-card">
                          <Truck className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-foreground">{activity.message}</p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString()} ·{" "}
                          {new Date(activity.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">No recent activity logged.</p>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
