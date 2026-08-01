"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { exportToCSV } from "@/utils/export-csv";
import { FileSpreadsheet, Download, DollarSign, Fuel, Wrench, Users, Truck } from "lucide-react";

interface ReportsProps {
  financialStats: {
    totalRevenue: number;
    totalFuel: number;
    totalMaintenance: number;
    netMargin: number;
  };
  vehicleUsage: {
    vehicleNumber: string;
    name: string;
    brand: string;
    model: string;
    distance: number;
    tripsCount: number;
    status: string;
  }[];
  driverPerformance: {
    employeeId: string;
    name: string;
    workingHours: number;
    overtime: number;
    tripsCount: number;
  }[];
  fuelLogs: {
    date: string;
    vehicleNumber: string;
    driverName: string;
    quantity: number;
    cost: number;
    mileage: number;
  }[];
  maintenanceLogs: {
    vehicleNumber: string;
    serviceHistory: string;
    cost: number;
    garage: string;
    date: string;
  }[];
}

export function ReportsManagerClient({
  financialStats,
  vehicleUsage,
  driverPerformance,
  fuelLogs,
  maintenanceLogs,
}: ReportsProps) {
  const [activeTab, setActiveTab] = useState<"financial" | "vehicles" | "drivers" | "fuel" | "maintenance">("financial");

  // Export handlers
  const handleExportFinancial = () => {
    const headers = ["Metric", "Amount ($)"];
    const rows = [
      ["Total Gross Revenue", financialStats.totalRevenue],
      ["Total Fuel Expenditure", financialStats.totalFuel],
      ["Total Maintenance Expenditure", financialStats.totalMaintenance],
      ["Net Operating Margin", financialStats.netMargin],
    ];
    exportToCSV("financial_report", headers, rows);
  };

  const handleExportVehicles = () => {
    const headers = ["Plate Number", "Name", "Brand", "Model", "Total Distance (km)", "Total Trips Booked", "Status"];
    const rows = vehicleUsage.map((v) => [
      v.vehicleNumber,
      v.name,
      v.brand,
      v.model,
      v.distance,
      v.tripsCount,
      v.status,
    ]);
    exportToCSV("vehicle_usage_report", headers, rows);
  };

  const handleExportDrivers = () => {
    const headers = ["Employee ID", "Name", "Total Hours Worked", "Overtime Hours", "Trips Completed"];
    const rows = driverPerformance.map((d) => [
      d.employeeId,
      d.name,
      d.workingHours,
      d.overtime,
      d.tripsCount,
    ]);
    exportToCSV("driver_performance_report", headers, rows);
  };

  const handleExportFuel = () => {
    const headers = ["Date", "Plate Number", "Driver Name", "Refuel Liters", "Total Cost ($)", "Calculated Mileage (km/L)"];
    const rows = fuelLogs.map((f) => [
      f.date,
      f.vehicleNumber,
      f.driverName,
      f.quantity,
      f.cost,
      f.mileage,
    ]);
    exportToCSV("fuel_report", headers, rows);
  };

  const handleExportMaintenance = () => {
    const headers = ["Service Date", "Plate Number", "Service History Summary", "Cost ($)", "Workshop Garage"];
    const rows = maintenanceLogs.map((m) => [
      m.date,
      m.vehicleNumber,
      m.serviceHistory,
      m.cost,
      m.garage,
    ]);
    exportToCSV("maintenance_report", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground">Download operations metrics and export data to CSV/Excel sheets.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-px">
        {[
          { id: "financial", label: "Financial Margins", icon: DollarSign },
          { id: "vehicles", label: "Vehicle Usage", icon: Truck },
          { id: "drivers", label: "Driver Performance", icon: Users },
          { id: "fuel", label: "Fuel Expenses", icon: Fuel },
          { id: "maintenance", label: "Maintenance Expenses", icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "financial" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border bg-gradient-to-tr from-green-50 to-white dark:from-green-950/10 dark:to-zinc-900">
              <CardHeader className="pb-2">
                <CardDescription>Total Revenues</CardDescription>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  ${financialStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border bg-gradient-to-tr from-yellow-50 to-white dark:from-yellow-950/10 dark:to-zinc-900">
              <CardHeader className="pb-2">
                <CardDescription>Total Fuel Expenditures</CardDescription>
                <CardTitle className="text-2xl text-yellow-600 dark:text-yellow-500">
                  ${financialStats.totalFuel.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border bg-gradient-to-tr from-red-50 to-white dark:from-red-950/10 dark:to-zinc-900">
              <CardHeader className="pb-2">
                <CardDescription>Total Maintenance Costs</CardDescription>
                <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                  ${financialStats.totalMaintenance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-border glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Net Fleet Operating Margin</CardTitle>
                <CardDescription>Consolidated ledger sheet</CardDescription>
              </div>
              <Button onClick={handleExportFinancial} size="sm">
                <Download className="h-4 w-4 mr-1.5" /> Export Sheet
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm max-w-lg bg-muted/40 p-6 rounded-xl border border-border/40">
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Gross Journey Revenues:</span>
                  <span className="font-semibold font-mono text-green-600 dark:text-green-400">+ ${financialStats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Fuel Expenses (Refuel logs):</span>
                  <span className="font-semibold font-mono text-red-500">- ${financialStats.totalFuel.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground">Workshop Repair Expenses:</span>
                  <span className="font-semibold font-mono text-red-500">- ${financialStats.totalMaintenance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold">
                  <span className="text-foreground">Net Operating Cash Margin:</span>
                  <span className={`font-mono ${financialStats.netMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    ${financialStats.netMargin.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "vehicles" && (
        <Card className="border-border glass animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vehicle Usage Registry</CardTitle>
              <CardDescription>Monitor wear and dispatch frequency per vehicle</CardDescription>
            </div>
            <Button onClick={handleExportVehicles} size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Name</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Brand & Model</TableHead>
                  <TableHead>Trips Booked</TableHead>
                  <TableHead>Current Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleUsage.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold">{v.name}</TableCell>
                    <TableCell className="font-mono text-xs">{v.vehicleNumber}</TableCell>
                    <TableCell>{v.brand} {v.model}</TableCell>
                    <TableCell className="font-mono">{v.tripsCount} trips</TableCell>
                    <TableCell>
                      <span className="capitalize text-xs font-semibold">{v.status.toLowerCase().replace("_", " ")}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "drivers" && (
        <Card className="border-border glass animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Driver Performance Audit</CardTitle>
              <CardDescription>Roster hours and completed jobs</CardDescription>
            </div>
            <Button onClick={handleExportDrivers} size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Overtime hours</TableHead>
                  <TableHead>Trips Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverPerformance.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.employeeId}</TableCell>
                    <TableCell className="font-mono">{d.workingHours} hrs</TableCell>
                    <TableCell className="font-mono text-yellow-600 dark:text-yellow-400">{d.overtime > 0 ? `${d.overtime} hrs` : "—"}</TableCell>
                    <TableCell className="font-mono">{d.tripsCount} jobs</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "fuel" && (
        <Card className="border-border glass animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fuel Efficiency Audit</CardTitle>
              <CardDescription>Refueling records and calculated mileages</CardDescription>
            </div>
            <Button onClick={handleExportFuel} size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Quantity (L)</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{f.date}</TableCell>
                    <TableCell className="font-mono text-xs">{f.vehicleNumber}</TableCell>
                    <TableCell>{f.driverName}</TableCell>
                    <TableCell className="font-mono">{f.quantity} L</TableCell>
                    <TableCell className="font-mono font-semibold">${f.cost.toFixed(2)}</TableCell>
                    <TableCell className="font-mono font-semibold text-primary">{f.mileage} km/L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "maintenance" && (
        <Card className="border-border glass animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Maintenance Audit Ledger</CardTitle>
              <CardDescription>Workshop costs and repair histories</CardDescription>
            </div>
            <Button onClick={handleExportMaintenance} size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>Service Summary</TableHead>
                  <TableHead>Repair Cost</TableHead>
                  <TableHead>Workshop Garage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceLogs.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{m.date}</TableCell>
                    <TableCell className="font-mono text-xs">{m.vehicleNumber}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={m.serviceHistory}>{m.serviceHistory}</TableCell>
                    <TableCell className="font-mono font-semibold text-red-600 dark:text-red-400">${m.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.garage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
