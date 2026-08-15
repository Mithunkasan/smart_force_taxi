import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Truck,
  Users,
  Clock,
  CalendarCheck,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export const revalidate = 0; // Disable caching to fetch live db values

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "TRANSPORT_MANAGER")) {
    redirect("/login");
  }

  const now = new Date();

  // 1. Fetch all vehicles and their active/future bookings (Trips)
  const vehicles = await db.vehicle.findMany({
    include: {
      trips: {
        where: {
          status: {
            notIn: ["CANCELLED", "COMPLETED"],
          },
        },
        include: {
          driver: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate vehicle availability dynamically: status is AVAILABLE and no active booking slot at present
  const availableCars = vehicles.filter(vehicle => {
    const hasActiveBooking = vehicle.trips.some(trip => {
      const start = new Date(trip.startTime);
      const end = new Date(trip.endTime);
      return now >= start && now < end;
    });
    return vehicle.status === "AVAILABLE" && !hasActiveBooking;
  });

  // Booked cars: vehicles with active or upcoming bookings
  const bookedCars = vehicles.map(vehicle => {
    const activeOrFutureBookings = vehicle.trips.filter(trip => {
      const end = new Date(trip.endTime);
      return end > now;
    });
    return {
      ...vehicle,
      bookings: activeOrFutureBookings,
    };
  }).filter(v => v.bookings.length > 0);

  // 2. Fetch all drivers and their active/future trips
  const drivers = await db.user.findMany({
    where: {
      role: "DRIVER",
    },
    include: {
      trips: {
        where: {
          status: {
            notIn: ["CANCELLED", "COMPLETED"],
          },
        },
        include: {
          vehicle: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Working drivers: drivers with an active booking right now
  const workingDrivers = drivers.filter(driver => {
    return driver.trips.some(trip => {
      const start = new Date(trip.startTime);
      const end = new Date(trip.endTime);
      return now >= start && now < end;
    });
  });

  // Free drivers: drivers without an active booking right now
  const freeDrivers = drivers.filter(driver => {
    const hasActiveBooking = driver.trips.some(trip => {
      const start = new Date(trip.startTime);
      const end = new Date(trip.endTime);
      return now >= start && now < end;
    });
    return !hasActiveBooking;
  });

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Fleet Control Center</h2>
        <p className="text-sm text-muted-foreground">
          Real-time vehicle availability, scheduled bookings, and driver working status.
        </p>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Cars Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Available Cars</p>
              <h3 className="text-2xl font-bold">{availableCars.length} Free</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ready to be booked
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Booked Cars Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Booked Cars</p>
              <h3 className="text-2xl font-bold">{bookedCars.length} Reserved</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Currently driving or scheduled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Working Drivers Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-500/10 p-3 text-purple-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Working Drivers</p>
              <h3 className="text-2xl font-bold">{workingDrivers.length} On Duty</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Currently assigned to a booking
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Free Drivers Stat */}
        <Card className="border-border glass glow-primary hover:-translate-y-1 transition-transform duration-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Free Drivers</p>
              <h3 className="text-2xl font-bold">{freeDrivers.length} Available</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ready for assignments
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Availability Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Side: Cars Status */}
        <div className="space-y-6">
          {/* Available Cars Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Available/Free Cars ({availableCars.length})
              </CardTitle>
              <CardDescription>Vehicles that are active and have no active booking slot.</CardDescription>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car Details</TableHead>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Odometer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableCars.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell className="font-semibold text-foreground">
                        {car.name} <span className="text-xs text-muted-foreground block">{car.brand} {car.model} ({car.year})</span>
                      </TableCell>
                      <TableCell className="font-mono text-primary font-bold text-xs">{car.vehicleNumber}</TableCell>
                      <TableCell className="text-xs font-semibold">{car.seatingCapacity} Seater</TableCell>
                      <TableCell className="font-mono text-xs">{car.odometer.toLocaleString()} km</TableCell>
                    </TableRow>
                  ))}
                  {availableCars.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs italic">
                        No vehicles are currently available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Booked Cars Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Booked Cars & Schedule ({bookedCars.length})
              </CardTitle>
              <CardDescription>Vehicles with active or upcoming reservations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookedCars.map((car) => (
                  <div key={car.id} className="border border-border/60 rounded-xl p-4 bg-muted/20 space-y-3 glass">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-foreground">{car.name}</span>
                        <span className="text-xs text-muted-foreground block">{car.brand} {car.model}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/20 bg-primary/5">{car.vehicleNumber}</Badge>
                    </div>
                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Booked Slots</span>
                      {car.bookings.map((booking) => {
                        const start = new Date(booking.startTime);
                        const end = new Date(booking.endTime);
                        const isActive = now >= start && now < end;
                        return (
                          <div key={booking.id} className="flex justify-between items-center text-xs bg-card p-2 rounded-lg border border-border/30">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                              {start.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} - {end.toLocaleTimeString([], { timeStyle: 'short' })}
                            </span>
                            <span className="font-semibold text-foreground">
                              {booking.driver?.name || booking.requestedBy || "N/A"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {bookedCars.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-xs italic border border-dashed border-border/40 rounded-xl">
                    No active or future vehicle bookings logged.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Drivers Status */}
        <div className="space-y-6">
          {/* Working Drivers Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                Working Drivers ({workingDrivers.length})
              </CardTitle>
              <CardDescription>Drivers who currently have an active booked slot.</CardDescription>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Car Booked</TableHead>
                    <TableHead>Booking Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workingDrivers.map((driver) => {
                    const activeTrip = driver.trips.find(trip => {
                      const start = new Date(trip.startTime);
                      const end = new Date(trip.endTime);
                      return now >= start && now < end;
                    });
                    return (
                      <TableRow key={driver.id}>
                        <TableCell className="font-semibold text-foreground">
                          {driver.name}
                          <span className="text-[10px] text-muted-foreground block font-mono">{driver.employeeId}</span>
                        </TableCell>
                        <TableCell>
                          {activeTrip ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-foreground">{activeTrip.vehicle?.name}</span>
                              <span className="font-mono text-[10px] text-primary font-bold">{activeTrip.vehicle?.vehicleNumber}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {activeTrip ? (
                            <span className="font-medium text-foreground">
                              {new Date(activeTrip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeTrip.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {workingDrivers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-xs italic">
                        No drivers are currently working.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Free Drivers Table */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Free / Available Drivers ({freeDrivers.length})
              </CardTitle>
              <CardDescription>Drivers registered who have no active shift assignments.</CardDescription>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Emergency Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {freeDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-semibold text-foreground">
                        {driver.name}
                        <span className="text-[10px] text-muted-foreground block">Exp: {driver.experience || 0} Years</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{driver.employeeId}</TableCell>
                      <TableCell className="text-xs">{driver.phone || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {freeDrivers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-xs italic">
                        No free drivers available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
