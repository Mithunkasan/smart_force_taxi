"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DashboardChartsProps {
  financialData: {
    name: string;
    Revenue: number;
    Fuel: number;
    Maintenance: number;
  }[];
  vehicleStatusData: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function DashboardCharts({ financialData, vehicleStatusData }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Financial Overview Chart */}
      <Card className="col-span-2 border-border glass glow-primary">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Monthly trends for Revenue, Fuel, and Maintenance expenses</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area type="monotone" dataKey="Fuel" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFuel)" />
              <Area
                type="monotone"
                dataKey="Maintenance"
                stroke="#dc2626"
                fillOpacity={1}
                fill="url(#colorMaint)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vehicle Status Distribution */}
      <Card className="border-border glass glow-primary">
        <CardHeader>
          <CardTitle>Fleet Status Distribution</CardTitle>
          <CardDescription>Breakdown of active vehicle conditions</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="75%">
            <PieChart>
              <Pie
                data={vehicleStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {vehicleStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs w-full px-4">
            {vehicleStatusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-muted-foreground capitalize">
                  {entry.name.toLowerCase().replace("_", " ")}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
