"use client";

import React, { useState, useTransition } from "react";
import { Attendance, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { checkInDriver, checkOutDriver } from "@/actions/attendance";
import { CalendarCheck, Clock, ShieldAlert, ArrowRightLeft } from "lucide-react";

interface AttendanceManagerProps {
  attendanceLogs: (Attendance & {
    driver: User;
  })[];
  drivers: User[];
}

export function AttendanceManagerClient({ attendanceLogs, drivers }: AttendanceManagerProps) {
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || "");
  const [isPending, startTransition] = useTransition();

  const handleAdminCheckIn = () => {
    if (!selectedDriverId) return;
    startTransition(async () => {
      const res = await checkInDriver(selectedDriverId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleAdminCheckOut = (driverId: string) => {
    startTransition(async () => {
      const res = await checkOutDriver(driverId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Attendance Tracker</h2>
          <p className="text-sm text-muted-foreground">Monitor driver shifts, track working hours, and review overtime logs.</p>
        </div>
      </div>

      {/* Manual Clock-in console for administrators */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm glass">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5 text-foreground">
          <ArrowRightLeft className="h-4.5 w-4.5 text-primary" /> Admin Check-In Console
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-xl">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground font-semibold">Select Driver</label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.employeeId})
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdminCheckIn} disabled={isPending} className="h-10">
            Check In Driver
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Driver Details</TableHead>
            <TableHead>Shift Start (Clock In)</TableHead>
            <TableHead>Shift End (Clock Out)</TableHead>
            <TableHead>Working Hours</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="font-semibold text-foreground">{log.driver.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{log.driver.employeeId} · {log.driver.shift}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs font-medium">
                  {new Date(log.checkIn).toLocaleDateString()} at{" "}
                  {new Date(log.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </TableCell>
              <TableCell>
                {log.checkOut ? (
                  <div className="text-xs font-medium">
                    {new Date(log.checkOut).toLocaleDateString()} at{" "}
                    {new Date(log.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">On Duty</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold">
                {log.checkOut ? `${log.workingHours} hrs` : "Running..."}
              </TableCell>
              <TableCell className="font-mono text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                {log.overtime > 0 ? `${log.overtime} hrs` : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={log.checkOut ? "success" : "info"}>
                  {log.checkOut ? "Completed" : "Clocked In"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {!log.checkOut && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                    onClick={() => handleAdminCheckOut(log.driverId)}
                    disabled={isPending}
                  >
                    Check Out
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {attendanceLogs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No attendance logs recorded for today.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>
    </div>
  );
}
