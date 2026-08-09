"use client";

import React, { useState } from "react";
import { User, DriverShift } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, Clock, UserCheck } from "lucide-react";

interface ShiftWithRelations extends DriverShift {
  driver: User;
}

interface ShiftManagerProps {
  shifts: ShiftWithRelations[];
}

export function ShiftManagerClient({ shifts }: ShiftManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Helper to determine status
  const getShiftBadge = (shift: ShiftWithRelations) => {
    if (shift.actualEnd) {
      return <Badge variant="success">Completed</Badge>;
    }
    return <Badge variant="info">Active Duty</Badge>;
  };

  const checkShiftStatusStr = (shift: ShiftWithRelations) => {
    if (shift.actualEnd) return "COMPLETED";
    return "ACTIVE";
  };

  // Filter shifts
  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      s.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.date.includes(searchTerm);

    const shiftStatus = checkShiftStatusStr(s);
    const matchesStatus = statusFilter === "ALL" || shiftStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Driver Duty Shifts</h2>
        <p className="text-sm text-muted-foreground">Monitor driver clock-in/out shifts, working durations, and attendance.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
          <input
            placeholder="Search by driver name, employee ID, date..."
            className="flex h-10 w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "ACTIVE", "COMPLETED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize text-xs font-semibold"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Shifts Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Configured Hours</TableHead>
            <TableHead>Actual Shift Start</TableHead>
            <TableHead>Actual Shift End</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredShifts.map((shift) => {
            return (
              <TableRow key={shift.id}>
                <TableCell className="font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {shift.driver.name}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {shift.driver.employeeId}
                </TableCell>
                <TableCell className="text-xs">
                  {shift.date}
                </TableCell>
                <TableCell className="text-xs">
                  <div className="font-semibold text-foreground">
                    {shift.shiftStart} ➔ {shift.shiftEnd}
                  </div>
                  <div className="text-[10px] text-muted-foreground">({shift.duration})</div>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {new Date(shift.actualStart).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {shift.actualEnd ? new Date(shift.actualEnd).toLocaleString() : "—"}
                </TableCell>
                <TableCell>
                  {getShiftBadge(shift)}
                </TableCell>
              </TableRow>
            );
          })}
          {filteredShifts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                No shift logs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>
    </div>
  );
}

// Simple internal Button component since ui/button might be imported differently or we can import from components/ui/button
import { Button } from "@/components/ui/button";
