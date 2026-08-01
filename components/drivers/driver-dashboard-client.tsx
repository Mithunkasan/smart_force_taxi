"use client";

import React, { useState, useEffect, useTransition } from "react";
import { User, Attendance } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { checkInDriver, checkOutDriver } from "@/actions/attendance";
import { Clock, ShieldAlert, Award, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

interface DriverDashboardClientProps {
  driver: User & {
    attendance: Attendance[];
  };
  activeAttendance: Attendance | null;
  assignedTripsCount: number;
  completedTripsCount: number;
}

export function DriverDashboardClient({
  driver,
  activeAttendance,
  assignedTripsCount,
  completedTripsCount,
}: DriverDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [timeElapsed, setTimeElapsed] = useState("00:00:00");

  // Format running clock duration when checked in
  useEffect(() => {
    if (!activeAttendance) {
      setTimeElapsed("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      const checkInTime = new Date(activeAttendance.checkIn).getTime();
      const now = Date.now();
      const diffMs = now - checkInTime;

      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted = [
        String(hrs).padStart(2, "0"),
        String(mins).padStart(2, "0"),
        String(secs).padStart(2, "0"),
      ].join(":");

      setTimeElapsed(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAttendance]);

  const handleCheckIn = () => {
    startTransition(async () => {
      const res = await checkInDriver(driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleCheckOut = () => {
    if (!confirm("Are you sure you want to end your shift and check out?")) return;
    startTransition(async () => {
      const res = await checkOutDriver(driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  // License alert
  const daysToExpiry = driver.licenseExpiry
    ? Math.ceil((new Date(driver.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 365;
  const isLicenseCritical = daysToExpiry < 30;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Driver Control Center</h2>
        <p className="text-sm text-muted-foreground">Manage your shift attendance, review assignments, and log closures.</p>
      </div>

      {/* Attendance & Shift timer widget */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 border-border glass glow-primary">
          <CardHeader>
            <CardTitle>Shift Attendance Console</CardTitle>
            <CardDescription>Clock in at shift start and clock out to record hours.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn("rounded-full p-4 transition-colors", activeAttendance ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
                <Clock className={cn("h-8 w-8", activeAttendance && "animate-spin-slow")} />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Shift Duration</span>
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground">{timeElapsed}</span>
                {activeAttendance && (
                  <span className="block text-[10px] text-green-500 font-semibold mt-1">Clocked in since: {new Date(activeAttendance.checkIn).toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {!activeAttendance ? (
                <Button onClick={handleCheckIn} disabled={isPending} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 hover:glow-green text-white">
                  Clock In Shift
                </Button>
              ) : (
                <Button onClick={handleCheckOut} disabled={isPending} variant="destructive" className="w-full sm:w-auto">
                  Clock Out Shift
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick info alerts */}
        <Card className="border-border glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-primary shrink-0" /> Security Check
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">License ID:</span>
              <span className="font-mono font-semibold">{driver.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-semibold">{driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : "N/A"}</span>
            </div>
            {isLicenseCritical && (
              <div className="flex items-start gap-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2.5 mt-2 text-yellow-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="font-medium text-[10px]">License expires in {daysToExpiry} days. Please schedule renewal.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Assigned Jobs</p>
              <h3 className="text-xl font-bold">{assignedTripsCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-500/10 p-3 text-green-500">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Completed Journeys</p>
              <h3 className="text-xl font-bold">{completedTripsCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Roster Shift</p>
              <h3 className="text-xl font-bold capitalize">{driver.shift}</h3>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
