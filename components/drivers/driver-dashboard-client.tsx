"use client";

import React, { useState, useEffect, useTransition } from "react";
import { User, Vehicle, Trip, DriverShift } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { startDriverShiftAction, endDriverShiftAction, pickVehicleAction, releaseVehicleAction } from "@/actions/shifts";
import { driverCreateWorkAction, driverAcceptWorkAction, driverStartWorkAction, driverCompleteWorkAction, driverCompleteTripWithDetailsAction } from "@/actions/driver-trips";
import { Clock, ShieldAlert, Award, Calendar, AlertCircle, MapPin, Truck, HelpCircle, Navigation, Milestone, DollarSign } from "lucide-react";
import { cn } from "@/utils/cn";

interface DriverDashboardClientProps {
  driver: User;
  activeShift: DriverShift | null;
  assignedVehicle: Vehicle | null;
  availableVehicles: Vehicle[];
  activeTrip: (Trip & { vehicle: Vehicle }) | null;
}

export function DriverDashboardClient({
  driver,
  activeShift,
  assignedVehicle,
  availableVehicles,
  activeTrip,
}: DriverDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [timeElapsed, setTimeElapsed] = useState("00:00:00");
  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  const [isCompleteFormOpen, setIsCompleteFormOpen] = useState(false);

  // Form State for self-assign work
  const [workData, setWorkData] = useState({
    purpose: "Corporate Duty",
    pickup: "",
    destination: "",
    startGpsUrl: "",
    destinationGpsUrl: "",
    notes: "",
  });

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

  const [formError, setFormError] = useState<string | null>(null);

  const handleCompleteTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeTrip || !assignedVehicle) return;

    const startOdo = activeTrip.vehicle.odometer;
    const endOdo = parseInt(closingData.endingOdometer, 10);

    if (isNaN(endOdo)) {
      setFormError("Ending Odometer must be a valid number.");
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
      const res = await driverCompleteTripWithDetailsAction(
        activeTrip.id,
        assignedVehicle.id,
        driver.id,
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

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsCompleteFormOpen(false);
      }
    });
  };

  // Running clock duration since shift start
  useEffect(() => {
    if (!activeShift) {
      setTimeElapsed("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      const checkInTime = new Date(activeShift.actualStart).getTime();
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
  }, [activeShift]);

  const handleStartShift = () => {
    startTransition(async () => {
      const res = await startDriverShiftAction(driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleEndShift = () => {
    if (!confirm("Are you sure you want to end your shift? If you have an assigned vehicle, it will be automatically released.")) return;
    startTransition(async () => {
      const res = await endDriverShiftAction(driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handlePickCar = (vehicleId: string) => {
    startTransition(async () => {
      const res = await pickVehicleAction(driver.id, vehicleId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleReleaseCar = () => {
    if (!assignedVehicle) return;
    if (!confirm("Are you sure you want to release this vehicle?")) return;
    startTransition(async () => {
      const res = await releaseVehicleAction(driver.id, assignedVehicle.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleAcceptWork = () => {
    if (!activeTrip) return;
    startTransition(async () => {
      const res = await driverAcceptWorkAction(activeTrip.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleStartWork = () => {
    if (!activeTrip || !assignedVehicle) return;
    startTransition(async () => {
      const res = await driverStartWorkAction(activeTrip.id, assignedVehicle.id, driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleCompleteWork = () => {
    if (!activeTrip || !assignedVehicle) return;
    startTransition(async () => {
      const res = await driverCompleteWorkAction(activeTrip.id, assignedVehicle.id, driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleWorkFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!workData.pickup || !workData.destination) {
      setFormError("Please enter both pickup and destination locations.");
      return;
    }

    startTransition(async () => {
      const res = await driverCreateWorkAction(driver.id, workData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsWorkFormOpen(false);
        setWorkData({
          purpose: "Corporate Duty",
          pickup: "",
          destination: "",
          startGpsUrl: "",
          destinationGpsUrl: "",
          notes: "",
        });
      }
    });
  };

  // Status labels
  const getDriverStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">Available</Badge>;
      case "ON_TRIP":
        return <Badge variant="info">On Trip (Busy)</Badge>;
      case "ON_BREAK":
        return <Badge variant="warning">On Break</Badge>;
      case "OFF_DUTY":
        return <Badge variant="secondary">Off Duty</Badge>;
      case "OFFLINE":
      default:
        return <Badge variant="danger">Offline</Badge>;
    }
  };

  const isShiftActive = driver.status !== "OFFLINE";

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Driver Control Center</h2>
          <p className="text-sm text-muted-foreground">Manage your shift hours, pick vehicles, and self-assign work.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {getDriverStatusLabel(driver.status)}
        </div>
      </div>

      {/* Roster Config / Start Shift Widget */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 border-border glass glow-primary">
          <CardHeader>
            <CardTitle>Today's Roster Shift</CardTitle>
            <CardDescription>Configure working shift: {driver.shiftStartTime || "06:00 AM"} → {driver.shiftEndTime || "06:00 PM"} ({driver.shiftDuration || "12 Hours"})</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn("rounded-full p-4 transition-colors", isShiftActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
                <Clock className={cn("h-8 w-8", isShiftActive && "animate-spin-slow")} />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase">Shift Active Time</span>
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground">{timeElapsed}</span>
                {activeShift && (
                  <span className="block text-[10px] text-green-500 font-semibold mt-1">Started: {new Date(activeShift.actualStart).toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {!isShiftActive ? (
                <Button onClick={handleStartShift} disabled={isPending} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 hover:glow-green text-white">
                  Start Shift
                </Button>
              ) : (
                <Button onClick={handleEndShift} disabled={isPending} variant="destructive" className="w-full sm:w-auto">
                  End Shift
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* License ID check */}
        <Card className="border-border glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-primary shrink-0" /> License Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver Name:</span>
              <span className="font-semibold">{driver.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License ID:</span>
              <span className="font-mono font-semibold">{driver.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-semibold">{driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isShiftActive && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Car Assignment Widget */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Current Vehicle
              </CardTitle>
              <CardDescription>Pick an available vehicle to start taking trips.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedVehicle ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border/40">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-muted-foreground uppercase">Assigned Car</span>
                    <h4 className="text-lg font-bold text-foreground">{assignedVehicle.name}</h4>
                    <span className="font-mono text-sm block font-bold text-primary">{assignedVehicle.vehicleNumber}</span>
                    <span className="text-xs block text-muted-foreground">Odometer: {assignedVehicle.odometer.toLocaleString()} km · Type: {assignedVehicle.carType}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReleaseCar} disabled={isPending || activeTrip?.status === "IN_PROGRESS"} className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600">
                    Release Car
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4 bg-muted/20 border border-border/40 rounded-xl">
                    <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">No car assigned to you right now. Pick one from the available fleet below:</p>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {availableVehicles.map((car) => (
                      <div key={car.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-lg hover:border-primary/20 transition-colors">
                        <div>
                          <span className="font-semibold text-sm text-foreground block">{car.name}</span>
                          <span className="font-mono text-xs text-muted-foreground block">{car.vehicleNumber} · {car.carType || "Sedan"}</span>
                        </div>
                        <Button size="sm" onClick={() => handlePickCar(car.id)} disabled={isPending}>
                          Pick Car
                        </Button>
                      </div>
                    ))}
                    {availableVehicles.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center italic py-2">No vehicles currently available in the fleet.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Work / Trip Widget */}
          <Card className="border-border bg-card flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Navigation className="h-5 w-5 text-primary" />
                  Current Active Work
                </CardTitle>
                <CardDescription>Log and track your trip locations and status details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTrip ? (
                  <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Work Reference</span>
                        <span className="font-mono text-sm font-bold text-foreground">{activeTrip.tripNumber}</span>
                      </div>
                      <Badge variant={activeTrip.status === "IN_PROGRESS" ? "info" : "warning"}>
                        {activeTrip.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Pickup Location:</span>
                        <span className="font-semibold text-foreground block">{activeTrip.pickup}</span>
                        {activeTrip.startGpsUrl && (
                          <a href={activeTrip.startGpsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold mt-1 inline-block">
                            View GPS Link ↗
                          </a>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Destination:</span>
                        <span className="font-semibold text-foreground block">{activeTrip.destination}</span>
                        {activeTrip.destinationGpsUrl && (
                          <a href={activeTrip.destinationGpsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold mt-1 inline-block">
                            View GPS Link ↗
                          </a>
                        )}
                      </div>
                    </div>

                    {activeTrip.notes && (
                      <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 mt-2">
                        <span className="font-semibold text-foreground block mb-0.5">Notes:</span>
                        {activeTrip.notes}
                      </div>
                    )}

                    {activeTrip.assignedBy === "ADMIN" && activeTrip.status === "ASSIGNED" && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 text-xs text-yellow-600 font-medium">
                        Work assigned to you by Administrator. Please accept to proceed.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/20 border border-border/40 rounded-xl">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">You currently have no active work assigned.</p>
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-6 pt-0 border-t border-border/40 mt-4 flex gap-2">
              {activeTrip ? (
                <>
                  {activeTrip.status === "ASSIGNED" && activeTrip.assignedBy === "ADMIN" && (
                    <Button onClick={handleAcceptWork} disabled={isPending} className="w-full bg-primary text-white">
                      Accept Work
                    </Button>
                  )}
                  {((activeTrip.status === "ASSIGNED" && activeTrip.assignedBy === "DRIVER") || activeTrip.status === "ACCEPTED") && (
                    <Button onClick={handleStartWork} disabled={isPending} className="w-full bg-primary text-white">
                      Start Work / Trip
                    </Button>
                  )}
                  {activeTrip.status === "IN_PROGRESS" && (
                    <Button onClick={() => {
                      setClosingData({
                        endingOdometer: String(activeTrip.vehicle.odometer || ""),
                        fuelExpense: "0",
                        tollExpense: "0",
                        parkingCharges: "0",
                        allowance: "0",
                        otherExpenses: "0",
                        billsUrl: "",
                        receiptsUrl: "",
                        remarks: "",
                      });
                      setParkingData({
                        location: "",
                        address: "",
                        landmark: "",
                        googleMapsLink: "",
                      });
                      setConditionData({
                        fuelLevel: "3/4",
                        tyreCondition: "Good",
                        interiorCondition: "Clean",
                        exteriorCondition: "Good",
                        remarks: "",
                      });
                      setFormError(null);
                      setIsCompleteFormOpen(true);
                    }} disabled={isPending} className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Trip Completed
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => setIsWorkFormOpen(true)} disabled={isPending || !assignedVehicle} className="w-full">
                  [ + Assign New Work ]
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Assign New Work Dialog */}
      <Dialog isOpen={isWorkFormOpen} onClose={() => setIsWorkFormOpen(false)} title="Assign New Work To Me">
        <form onSubmit={handleWorkFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Work / Trip Type</label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              value={workData.purpose}
              onChange={(e) => setWorkData({ ...workData, purpose: e.target.value })}
            >
              <option value="Corporate Duty">Corporate Duty</option>
              <option value="Client Transport">Client Transport</option>
              <option value="Airport Shuttle">Airport Shuttle</option>
              <option value="Delivery / Goods Shuttle">Delivery / Goods Shuttle</option>
              <option value="Other Operations">Other Operations</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Start Location</label>
              <Input
                placeholder="e.g. Chennai"
                value={workData.pickup}
                onChange={(e) => setWorkData({ ...workData, pickup: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Destination</label>
              <Input
                placeholder="e.g. Airport"
                value={workData.destination}
                onChange={(e) => setWorkData({ ...workData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Start GPS / Google Maps URL</label>
            <Input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={workData.startGpsUrl}
              onChange={(e) => setWorkData({ ...workData, startGpsUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Destination GPS / Google Maps URL</label>
            <Input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={workData.destinationGpsUrl}
              onChange={(e) => setWorkData({ ...workData, destinationGpsUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Notes / Remarks</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              placeholder="Enter special instructions or notes..."
              value={workData.notes}
              onChange={(e) => setWorkData({ ...workData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsWorkFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              ASSIGN WORK TO ME
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Trip Completed Update Details Dialog */}
      <Dialog isOpen={isCompleteFormOpen} onClose={() => setIsCompleteFormOpen(false)} title="Trip Completed: Update Details" className="max-w-2xl">
        {activeTrip && (
          <form onSubmit={handleCompleteTripSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
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
                    value={activeTrip.vehicle.odometer}
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
                    min={activeTrip.vehicle.odometer}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Calculated Distance: <span className="font-bold text-foreground font-mono">
                  {parseInt(closingData.endingOdometer, 10) >= activeTrip.vehicle.odometer 
                    ? parseInt(closingData.endingOdometer, 10) - activeTrip.vehicle.odometer 
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
              <Button type="button" variant="outline" onClick={() => setIsCompleteFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:glow-green">
                SUBMIT & COMPLETE TRIP
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
