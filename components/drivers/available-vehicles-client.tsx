"use client";

import React, { useState, useEffect } from "react";
import { Search, Truck, Users, Milestone, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { CarBookingGrid } from "@/components/vehicles/car-booking-grid";
import { Vehicle, Trip, User } from "@prisma/client";

interface AvailableVehiclesClientProps {
  vehicles: Vehicle[];
  bookings: (Trip & { driver?: User | null; vehicle?: Vehicle | null })[];
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
}

export function AvailableVehiclesClient({
  vehicles,
  bookings,
  currentUserId,
  currentUserRole,
  currentUserName,
}: AvailableVehiclesClientProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const searchString = `${v.name} ${v.brand} ${v.model} ${v.vehicleNumber}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      {/* Title section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Available Fleet</h2>
        <p className="text-sm text-muted-foreground">
          View all currently unassigned and free vehicles and select one to book.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
        <Input
          placeholder="Search available cars by name or plate number..."
          className="pl-10 bg-card"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid of Vehicles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="border-border bg-card transition-all duration-200 hover:border-primary/20 hover:shadow-md glass flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">{vehicle.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </CardDescription>
                  </div>
                  <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {vehicle.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Vehicle specifications */}
                <div className="grid grid-cols-2 gap-2 text-xs border-b border-border/40 pb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{vehicle.seatingCapacity} Seater</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                    <Milestone className="h-3.5 w-3.5" />
                    <span className="font-mono">{vehicle.odometer.toLocaleString()} km</span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Plate Number</span>
                    <span className="block font-mono text-sm font-semibold text-foreground">{vehicle.vehicleNumber}</span>
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Book Vehicle Action */}
            <div className="p-4 pt-0 border-t border-border/40 mt-4">
              <button 
                onClick={() => setSelectedVehicleForBooking(vehicle)}
                className="w-full inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-amber-500 hover:bg-amber-600 text-zinc-950 hover:glow-primary h-9 px-3 gap-1.5 cursor-pointer font-bold border-none"
              >
                <Calendar className="h-4 w-4" />
                Book This Vehicle
              </button>
            </div>
          </Card>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground glass rounded-xl border border-border">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-foreground">No vehicles found</h3>
            <p className="text-xs mt-1">There are no available vehicles matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Car Slot Booking Calendar Dialog */}
      {selectedVehicleForBooking && (
        <Dialog isOpen={!!selectedVehicleForBooking} onClose={() => setSelectedVehicleForBooking(null)} title="Car Slot Booking Calendar" className="max-w-4xl">
          <CarBookingGrid
            vehicle={selectedVehicleForBooking}
            bookings={bookings.filter((b) => b.vehicleId === selectedVehicleForBooking.id)}
            drivers={[]}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            onClose={() => setSelectedVehicleForBooking(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
