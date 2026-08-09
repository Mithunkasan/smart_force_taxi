import React from "react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
  MapPin,
} from "lucide-react";

export const revalidate = 0; // Disable caching to fetch live db values

export default async function AdminDashboard() {
  // 1. Vehicle counts
  const totalVehicles = await db.vehicle.count();
  const availableVehicles = await db.vehicle.count({ where: { status: "AVAILABLE" } });
  const assignedVehicles = await db.vehicle.count({ where: { status: "ASSIGNED" } });
  const tripVehicles = await db.vehicle.count({ where: { status: "ON_TRIP" } });
  const maintenanceVehicles = await db.vehicle.count({ where: { status: "MAINTENANCE" } });
  const offlineVehicles = await db.vehicle.count({ where: { status: "OFFLINE" } });

  // 2. Driver counts
  const totalDrivers = await db.user.count({ where: { role: "DRIVER" } });
  const availableDrivers = await db.user.count({ where: { role: "DRIVER", status: "AVAILABLE" } });
  const busyDrivers = totalDrivers - availableDrivers;

  // 3. Work counts
  const activeWorksCount = await db.trip.count({
    where: {
      status: {
        in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"],
      },
    },
  });

  const completedWorksCount = await db.trip.count({
    where: {
      status: "COMPLETED",
    },
  });

  // 4. Financial totals (mock summaries or historical fuel logs)
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
    { name: "ASSIGNED", value: assignedVehicles, color: "#3b82f6" },
    { name: "ON TRIP", value: tripVehicles, color: "#a855f7" },
    { name: "MAINTENANCE", value: maintenanceVehicles, color: "#eab308" },
    { name: "OFFLINE", value: offlineVehicles, color: "#dc2626" },
  ].filter((item) => item.value > 0);

  // 7. Fetch recent notifications
  const recentActivities = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 8. Load all Drivers with current assigned Vehicle and active Work Trip
  const driversList = await db.user.findMany({
    where: {
      role: "DRIVER",
    },
    include: {
      assignedVehicles: true,
      trips: {
        where: {
          status: {
            in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"],
          },
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const getDriverStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">Available</Badge>;
      case "ON_TRIP":
        return <Badge variant="info">On Trip</Badge>;
      case "ON_BREAK":
        return <Badge variant="warning">On Break</Badge>;
      case "OFF_DUTY":
        return <Badge variant="secondary">Off Duty</Badge>;
      case "OFFLINE":
      default:
        return <Badge variant="danger">Offline</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Fleet Control Center</h2>
        <p className="text-sm text-muted-foreground">
          Real-time diagnostics, driver working status tracking, and vehicle availability overview.
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
              <p className="text-xs font-semibold text-muted-foreground">Cars / Vehicles</p>
              <h3 className="text-2xl font-bold">{totalVehicles} Total</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-green-500 font-semibold">{availableVehicles}</span> Available ·{" "}
                <span className="text-purple-500 font-semibold">{tripVehicles}</span> Busy
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
              <p className="text-xs font-semibold text-muted-foreground">Drivers</p>
              <h3 className="text-2xl font-bold">{totalDrivers} Registered</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="text-green-500 font-semibold">{availableDrivers}</span> Available ·{" "}
                <span className="text-blue-500 font-semibold">{busyDrivers}</span> Busy / Offline
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Work Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3 text-green-500">
              <Route className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Active Work Logs</p>
              <h3 className="text-2xl font-bold">{activeWorksCount} Running</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Current ongoing/assigned trips
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Work Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-yellow-500/10 p-3 text-yellow-500">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Completed Works</p>
              <h3 className="text-2xl font-bold">{completedWorksCount} Audited</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Cumulative historical trips
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Driver + Car + Work Tracker Table */}
      <Card className="border-border bg-card">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Real-time Driver Status & Assignment Tracking</h3>
          <TableContainer>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Car Assigned</TableHead>
                <TableHead>Shift Duration</TableHead>
                <TableHead>Active Work Route</TableHead>
                <TableHead>Duty Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driversList.map((drv) => {
                const car = drv.assignedVehicles[0] || null;
                const trip = drv.trips[0] || null;

                return (
                  <TableRow key={drv.id}>
                    <TableCell className="font-semibold">{drv.name}</TableCell>
                    <TableCell>
                      {car ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{car.name}</span>
                          <span className="font-mono text-xs text-primary font-bold">{car.vehicleNumber}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {drv.status !== "OFFLINE" ? (
                        <span>{drv.shiftDuration || "12 Hours"}</span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {trip ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-mono text-xs text-primary font-bold">{trip.tripNumber}</span>
                          <span>{trip.pickup} ➔ {trip.destination}</span>
                          <span className="text-[9px] text-muted-foreground">({trip.status})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getDriverStatusBadge(drv.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {driversList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No drivers registered in the database.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </TableContainer>
        </div>
      </Card>

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
