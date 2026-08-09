"use client";

import React, { useState } from "react";
import { Trip, Vehicle } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Clock, Navigation, MapPin } from "lucide-react";

interface DriverTripsProps {
  trips: (Trip & {
    vehicle: Vehicle;
  })[];
}

export function DriverTripsClient({ trips }: DriverTripsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrips = trips.filter((t) => {
    const searchString = `${t.tripNumber} ${t.pickup} ${t.destination} ${t.vehicle.vehicleNumber} ${t.purpose}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="info">In Progress</Badge>;
      case "ACCEPTED":
        return <Badge variant="warning">Accepted</Badge>;
      case "ASSIGNED":
      default:
        return <Badge variant="secondary">Assigned</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Work History</h2>
        <p className="text-sm text-muted-foreground">Review and track all your logged self-assigned and admin-assigned work history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-500/10 p-3 text-green-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Completed Trips</p>
              <h3 className="text-xl font-bold">{trips.filter((t) => t.status === "COMPLETED").length}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <input
          placeholder="Search history by trip number, route, plate..."
          className="flex h-10 w-full max-w-md rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Trips Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Trip Number</TableHead>
            <TableHead>Car / Vehicle</TableHead>
            <TableHead>Route (Pickup ➔ Destination)</TableHead>
            <TableHead>GPS Locations</TableHead>
            <TableHead>Actual Times</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Assigned By</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrips.map((trip) => {
            return (
              <TableRow key={trip.id}>
                <TableCell className="font-mono text-xs font-bold text-primary">
                  {trip.tripNumber}
                </TableCell>
                <TableCell>
                  <div className="text-xs font-semibold text-foreground">{trip.vehicle.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{trip.vehicle.vehicleNumber}</div>
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {trip.pickup} <span className="text-muted-foreground">➔</span> {trip.destination}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-[10px]">
                    {trip.startGpsUrl ? (
                      <a href={trip.startGpsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> Pickup GPS ↗
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">No Start GPS</span>
                    )}
                    {trip.destinationGpsUrl ? (
                      <a href={trip.destinationGpsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> Destination GPS ↗
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">No End GPS</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="text-muted-foreground">
                    Start: {trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString() : "N/A"}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    End: {trip.actualEndTime ? new Date(trip.actualEndTime).toLocaleString() : "N/A"}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {trip.durationMinutes ? `${trip.durationMinutes} min` : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant={trip.assignedBy === "DRIVER" ? "success" : "default"}>
                    {trip.assignedBy || "DRIVER"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getStatusBadge(trip.status)}
                </TableCell>
              </TableRow>
            );
          })}
          {filteredTrips.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                No past trips found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>
    </div>
  );
}
