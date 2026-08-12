"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Trip, Vehicle, TripClosing, ParkingLocation, VehicleConditionReport } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Clock, Navigation, MapPin, Milestone, DollarSign, Truck } from "lucide-react";
import { driverCompleteTripWithDetailsAction, driverUpdateTripDetailsAction } from "@/actions/driver-trips";

interface DriverTripsProps {
  trips: (Trip & {
    vehicle: Vehicle;
    closing: TripClosing | null;
    parking: ParkingLocation | null;
    conditionReport: VehicleConditionReport | null;
  })[];
  driverId: string;
}

export function DriverTripsClient({ trips, driverId }: DriverTripsProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<typeof trips[0] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDateTime = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "—";
    if (!mounted) {
      return new Date(dateVal).toISOString().substring(0, 19).replace("T", " ");
    }
    return new Date(dateVal).toLocaleString();
  };

  const [closingData, setClosingData] = useState({
    endingOdometer: "",
    fuelExpense: "0",
    tollExpense: "0",
    parkingCharges: "0",
    allowance: "0",
    otherExpenses: "0",
    billsUrl: "",
    receiptsUrl: "",
    remarks: "",
  });

  const [parkingData, setParkingData] = useState({
    location: "",
    address: "",
    landmark: "",
    googleMapsLink: "",
  });

  const [conditionData, setConditionData] = useState({
    fuelLevel: "3/4",
    tyreCondition: "Good",
    interiorCondition: "Clean",
    exteriorCondition: "Good",
    remarks: "",
  });

  const handleOpenForm = (trip: typeof trips[0]) => {
    setSelectedTrip(trip);
    setClosingData({
      endingOdometer: String(trip.closing?.endingOdometer || trip.vehicle.odometer || ""),
      fuelExpense: String(trip.closing?.fuelExpense || "0"),
      tollExpense: String(trip.closing?.tollExpense || "0"),
      parkingCharges: String(trip.closing?.parkingCharges || "0"),
      allowance: String(trip.closing?.allowance || "0"),
      otherExpenses: String(trip.closing?.otherExpenses || "0"),
      billsUrl: trip.closing?.billsUrl || "",
      receiptsUrl: trip.closing?.receiptsUrl || "",
      remarks: trip.closing?.remarks || "",
    });
    setParkingData({
      location: trip.parking?.location || "",
      address: trip.parking?.address || "",
      landmark: trip.parking?.landmark || "",
      googleMapsLink: trip.parking?.googleMapsLink || "",
    });
    setConditionData({
      fuelLevel: trip.conditionReport?.fuelLevel || "3/4",
      tyreCondition: trip.conditionReport?.tyreCondition || "Good",
      interiorCondition: trip.conditionReport?.interiorCondition || "Clean",
      exteriorCondition: trip.conditionReport?.exteriorCondition || "Good",
      remarks: trip.conditionReport?.remarks || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTrip) return;

    const startOdo = selectedTrip.closing?.startingOdometer || selectedTrip.vehicle.odometer;
    const endOdo = parseInt(closingData.endingOdometer, 10);

    if (isNaN(endOdo)) {
      setFormError("Ending Odometer must be a number.");
      return;
    }

    if (endOdo < startOdo) {
      setFormError(`Ending Odometer (${endOdo} km) cannot be less than Starting Odometer (${startOdo} km).`);
      return;
    }

    if (!parkingData.location || !parkingData.address) {
      setFormError("Please fill out the parking location name and address.");
      return;
    }

    const distanceTravelled = endOdo - startOdo;

    startTransition(async () => {
      let res;
      if (selectedTrip.status === "IN_PROGRESS") {
        res = await driverCompleteTripWithDetailsAction(
          selectedTrip.id,
          selectedTrip.vehicleId,
          driverId,
          {
            startingOdometer: startOdo,
            endingOdometer: endOdo,
            distanceTravelled,
            tripAmount: 0.0,
            fuelExpense: parseFloat(closingData.fuelExpense) || 0.0,
            tollExpense: parseFloat(closingData.tollExpense) || 0.0,
            parkingCharges: parseFloat(closingData.parkingCharges) || 0.0,
            allowance: parseFloat(closingData.allowance) || 0.0,
            otherExpenses: parseFloat(closingData.otherExpenses) || 0.0,
            billsUrl: closingData.billsUrl || undefined,
            receiptsUrl: closingData.receiptsUrl || undefined,
            remarks: closingData.remarks || undefined,
          },
          parkingData,
          conditionData
        );
      } else {
        res = await driverUpdateTripDetailsAction(
          selectedTrip.id,
          {
            startingOdometer: startOdo,
            endingOdometer: endOdo,
            distanceTravelled,
            tripAmount: 0.0,
            fuelExpense: parseFloat(closingData.fuelExpense) || 0.0,
            tollExpense: parseFloat(closingData.tollExpense) || 0.0,
            parkingCharges: parseFloat(closingData.parkingCharges) || 0.0,
            allowance: parseFloat(closingData.allowance) || 0.0,
            otherExpenses: parseFloat(closingData.otherExpenses) || 0.0,
            billsUrl: closingData.billsUrl || undefined,
            receiptsUrl: closingData.receiptsUrl || undefined,
            remarks: closingData.remarks || undefined,
          },
          parkingData,
          conditionData
        );
      }

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsFormOpen(false);
      }
    });
  };

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
            <TableHead className="text-right">Action</TableHead>
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
                    Start: {formatDateTime(trip.actualStartTime)}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    End: {formatDateTime(trip.actualEndTime)}
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
                <TableCell className="text-right">
                  {trip.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenForm(trip)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-1 px-2.5 h-8 rounded-lg"
                    >
                      Trip Completed
                    </Button>
                  )}
                  {trip.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenForm(trip)}
                      className="font-semibold text-xs py-1 px-2.5 h-8 rounded-lg hover:bg-muted"
                    >
                      Update Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {filteredTrips.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                No past trips found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Details Form Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedTrip?.status === "IN_PROGRESS" ? "Trip Completed: Update Details" : "Update Trip Details"} className="max-w-2xl">
        {selectedTrip && (
          <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {formError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
                {formError}
              </div>
            )}

            {/* Odometer Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <Milestone className="h-4 w-4" /> Odometer Readings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Starting Odometer (km)</label>
                  <Input
                    type="number"
                    value={selectedTrip.closing?.startingOdometer || selectedTrip.vehicle.odometer}
                    disabled
                    className="bg-muted/50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Ending Odometer (km)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 45150"
                    value={closingData.endingOdometer}
                    onChange={(e) => setClosingData({ ...closingData, endingOdometer: e.target.value })}
                    required
                    className="font-mono"
                    min={selectedTrip.closing?.startingOdometer || selectedTrip.vehicle.odometer}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Calculated Distance: <span className="font-bold text-foreground font-mono">
                  {parseInt(closingData.endingOdometer, 10) >= (selectedTrip.closing?.startingOdometer || selectedTrip.vehicle.odometer)
                    ? parseInt(closingData.endingOdometer, 10) - (selectedTrip.closing?.startingOdometer || selectedTrip.vehicle.odometer)
                    : 0}
                </span> km
              </div>
            </div>

            {/* Expenses claims section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <DollarSign className="h-4 w-4" /> Trip Expenses & Allowance Claims
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Expense ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.fuelExpense}
                    onChange={(e) => setClosingData({ ...closingData, fuelExpense: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Receipt / Bill Proof Name</label>
                  <Input
                    placeholder="e.g. fuel_receipt.jpg"
                    value={closingData.billsUrl}
                    onChange={(e) => setClosingData({ ...closingData, billsUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Toll Expense ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.tollExpense}
                    onChange={(e) => setClosingData({ ...closingData, tollExpense: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Toll Receipt Proof Name</label>
                  <Input
                    placeholder="e.g. toll_receipt.png"
                    value={closingData.receiptsUrl}
                    onChange={(e) => setClosingData({ ...closingData, receiptsUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parking Charges ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.parkingCharges}
                    onChange={(e) => setClosingData({ ...closingData, parkingCharges: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Driver Allowance ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.allowance}
                    onChange={(e) => setClosingData({ ...closingData, allowance: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Other Expenses ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.otherExpenses}
                    onChange={(e) => setClosingData({ ...closingData, otherExpenses: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Remarks / Expenses Description</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Provide details about allowance claims, parking location, or other expenses..."
                    value={closingData.remarks}
                    onChange={(e) => setClosingData({ ...closingData, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Parking location section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <MapPin className="h-4 w-4" /> Parking Location (Vehicle Handover Spot)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Parking Location Name</label>
                  <Input
                    placeholder="e.g. Airport Terminal 3 Main Parking, Bay B-10"
                    value={parkingData.location}
                    onChange={(e) => setParkingData({ ...parkingData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Exact Address</label>
                  <Input
                    placeholder="e.g. Meenambakkam, Chennai, Tamil Nadu 600027"
                    value={parkingData.address}
                    onChange={(e) => setParkingData({ ...parkingData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Landmark / Parking Level</label>
                  <Input
                    placeholder="e.g. Near Pillar 45 / Level 2"
                    value={parkingData.landmark}
                    onChange={(e) => setParkingData({ ...parkingData, landmark: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Google Maps Link</label>
                  <Input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={parkingData.googleMapsLink}
                    onChange={(e) => setParkingData({ ...parkingData, googleMapsLink: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle condition section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <Truck className="h-4 w-4" /> Vehicle Return Condition Report
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Level</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.fuelLevel}
                    onChange={(e) => setConditionData({ ...conditionData, fuelLevel: e.target.value })}
                  >
                    <option value="F">Full (F)</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="E">Empty (E)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tyres Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.tyreCondition}
                    onChange={(e) => setConditionData({ ...conditionData, tyreCondition: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Worn">Worn</option>
                    <option value="Needs Replacement">Needs Replacement</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Interior Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.interiorCondition}
                    onChange={(e) => setConditionData({ ...conditionData, interiorCondition: e.target.value })}
                  >
                    <option value="Clean">Clean</option>
                    <option value="Needs Cleaning">Needs Cleaning</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Exterior Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.exteriorCondition}
                    onChange={(e) => setConditionData({ ...conditionData, exteriorCondition: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Scratches">Scratches</option>
                    <option value="Dents">Dents</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Condition Report Remarks</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                    placeholder="Enter any dents, scratches, cleanliness issues, or standard comments..."
                    value={conditionData.remarks}
                    onChange={(e) => setConditionData({ ...conditionData, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm hover:glow-green">
                {selectedTrip.status === "IN_PROGRESS" ? "SUBMIT & COMPLETE TRIP" : "UPDATE DETAILS"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
