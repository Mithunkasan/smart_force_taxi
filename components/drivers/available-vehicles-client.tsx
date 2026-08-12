"use client";

import React, { useState, useEffect } from "react";
import { Search, Truck, MapPin, Compass, ExternalLink, Users, Milestone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AvailableVehicle {
  id: string;
  vehicleNumber: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  seatingCapacity: number;
  odometer: number;
  status: string;
  parkingLocation: {
    location: string;
    address: string;
    landmark: string | null;
    googleMapsLink: string | null;
    parkingTime: Date;
  } | null;
}

interface AvailableVehiclesClientProps {
  vehicles: AvailableVehicle[];
}

export function AvailableVehiclesClient({ vehicles }: AvailableVehiclesClientProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const searchString = `${v.name} ${v.brand} ${v.model} ${v.vehicleNumber} ${
      v.parkingLocation?.location || ""
    } ${v.parkingLocation?.address || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      {/* Title section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Available Fleet</h2>
        <p className="text-sm text-muted-foreground">
          View all currently unassigned and free vehicles, along with their exact parking spots.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
        <Input
          placeholder="Search available cars by name, number, or location..."
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

                {/* Location details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <MapPin className="h-4 w-4" />
                    <span>Parking Location</span>
                  </div>
                  
                  {vehicle.parkingLocation ? (
                    <div className="bg-muted/30 border border-border/40 rounded-lg p-3 text-xs space-y-2">
                      <div>
                        <span className="font-semibold text-foreground block">{vehicle.parkingLocation.location}</span>
                        <span className="text-muted-foreground block mt-0.5">{vehicle.parkingLocation.address}</span>
                      </div>
                      
                      {vehicle.parkingLocation.landmark && (
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wide">Landmark</span>
                          <span className="text-foreground">{vehicle.parkingLocation.landmark}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        Parked at: {mounted ? new Date(vehicle.parkingLocation.parkingTime).toLocaleString() : "Loading..."}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic bg-muted/20 border border-border/20 rounded-lg p-3 text-center">
                      No parking location registered. Vehicle is at Base Station/Depot.
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            {/* Clickable Parking Link Action */}
            <div className="p-4 pt-0 border-t border-border/40 mt-4">
              {vehicle.parkingLocation?.googleMapsLink ? (
                <a 
                  href={vehicle.parkingLocation.googleMapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border bg-transparent shadow-sm hover:bg-primary hover:text-white hover:glow-primary h-9 px-3 gap-1.5 cursor-pointer"
                >
                  <Compass className="h-4 w-4" />
                  Navigate to Vehicle
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              ) : (
                <Button 
                  disabled 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs opacity-50 cursor-not-allowed"
                >
                  <Compass className="h-4 w-4 mr-1.5" />
                  Navigation Link Unavailable
                </Button>
              )}
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
    </div>
  );
}
