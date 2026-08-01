"use client";

import React, { useState, useTransition } from "react";
import { Trip, Vehicle, TripClosing, VehicleConditionReport, ParkingLocation } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { startTripAction, closeTripAction, reportVehicleIssue, acceptTripAction } from "@/actions/driver-trips";
import { MapPin, Calendar, Clock, Truck, Milestone, AlertTriangle, CheckCircle, Navigation, Landmark } from "lucide-react";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/utils/cn";
import { useTranslation } from "@/components/layout/language-provider";

interface DriverTripsProps {
  trips: (Trip & {
    vehicle: Vehicle & {
      trips?: (Trip & {
        parking: ParkingLocation | null;
      })[];
    };
    closing: TripClosing | null;
    parking: ParkingLocation | null;
  })[];
  driverId: string;
}

export function DriverTripsClient({ trips, driverId }: DriverTripsProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTrip, setActiveTrip] = useState<(Trip & { vehicle: Vehicle }) | null>(null);
  const [activeTab, setActiveTab] = useState<"my-trips" | "available-jobs">("my-trips");
  const { t } = useTranslation();
  
  // Dialogs
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  
  // Form wizard steps
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Issue reporting form
  const [issueVehicleId, setIssueVehicleId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  // Closing wizard form data
  const [closingData, setClosingData] = useState({
    startingOdometer: 0,
    endingOdometer: 0,
    distanceTravelled: 0,
    tripAmount: 1500.0, // standard allowance
    fuelExpense: 0,
    tollExpense: 0,
    parkingCharges: 0,
    otherExpenses: 0,
    remarks: "",
  });

  const [parkingData, setParkingData] = useState({
    location: "",
    address: "",
    landmark: "",
    googleMapsLink: "",
  });

  const [conditionData, setConditionData] = useState({
    fuelLevel: "1/2",
    tyreCondition: "Good",
    interiorCondition: "Clean",
    exteriorCondition: "Good",
    remarks: "",
  });

  const handleStartTrip = (tripId: string, vehicleId: string) => {
    if (!confirm("Are you ready to depart and start this journey?")) return;
    startTransition(async () => {
      const res = await startTripAction(tripId, vehicleId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleAcceptJob = (tripId: string) => {
    if (!confirm("Are you sure you want to accept this job and assign it to yourself?")) return;
    startTransition(async () => {
      const res = await acceptTripAction(tripId, driverId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleOpenClosing = (trip: Trip & { vehicle: Vehicle }) => {
    setActiveTrip(trip);
    setClosingData({
      startingOdometer: trip.vehicle.odometer,
      endingOdometer: trip.vehicle.odometer,
      distanceTravelled: 0,
      tripAmount: 1500.0,
      fuelExpense: 0,
      tollExpense: 0,
      parkingCharges: 0,
      otherExpenses: 0,
      remarks: "",
    });
    setParkingData({
      location: "",
      address: "",
      landmark: "",
      googleMapsLink: "",
    });
    setConditionData({
      fuelLevel: "1/2",
      tyreCondition: "Good",
      interiorCondition: "Clean",
      exteriorCondition: "Good",
      remarks: "",
    });
    setStep(1);
    setFormError(null);
    setIsClosingOpen(true);
  };

  const handleOpenIssue = (vehicleId: string) => {
    setIssueVehicleId(vehicleId);
    setIssueDescription("");
    setIsIssueOpen(true);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription) return;

    startTransition(async () => {
      const res = await reportVehicleIssue(issueVehicleId, driverId, issueDescription);
      if (res.error) {
        alert(res.error);
      } else {
        setIsIssueOpen(false);
      }
    });
  };

  const calculateDistance = (ending: number) => {
    const start = closingData.startingOdometer;
    const distance = Math.max(0, ending - start);
    setClosingData({
      ...closingData,
      endingOdometer: ending,
      distanceTravelled: distance,
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (closingData.endingOdometer < closingData.startingOdometer) {
        setFormError("Ending odometer cannot be less than starting odometer.");
        return;
      }
    }
    setFormError(null);
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setFormError(null);
    setStep(step - 1);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    startTransition(async () => {
      const res = await closeTripAction(
        activeTrip.id,
        activeTrip.vehicleId,
        closingData,
        parkingData,
        conditionData
      );

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsClosingOpen(false);
      }
    });
  };

  // Filter and partition trips
  const myTrips = trips.filter((t) => t.driverId === driverId);
  const availableTrips = trips.filter((t) => t.driverId === null);

  const activeOngoing = myTrips.find((t) => t.status === "STARTED");
  const upcomingAssigned = myTrips.filter((t) => t.status === "ASSIGNED" || t.status === "APPROVED");
  const pastTrips = myTrips.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("trip_portal")}</h2>
        <p className="text-sm text-muted-foreground">{t("manage_assignments")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("my-trips")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 px-1 transition-all duration-200 cursor-pointer",
            activeTab === "my-trips"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t("my_assignments")} ({myTrips.length})
        </button>
        <button
          onClick={() => setActiveTab("available-jobs")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 px-1 transition-all duration-200 cursor-pointer",
            activeTab === "available-jobs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t("available_jobs")} ({availableTrips.length})
        </button>
      </div>

      {activeTab === "my-trips" ? (
        <>
          {/* Active Trip Visualizer */}
          {activeOngoing ? (
            <Card className="border-primary/20 bg-gradient-to-tr from-zinc-900 to-primary/20 text-white glow-primary-strong border p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <Badge className="bg-primary text-white">{t("active_journey")}</Badge>
                  <h3 className="text-2xl font-bold font-mono tracking-tight">{activeOngoing.tripNumber}</h3>
                  <p className="text-sm text-zinc-300">
                    {t("route")}: <span className="font-semibold text-white">{activeOngoing.pickup}</span> ➔ <span className="font-semibold text-white">{activeOngoing.destination}</span>
                  </p>
                  <div className="text-xs text-zinc-400 space-y-1 mt-3">
                    <div>Started: {new Date(activeOngoing.startTime).toLocaleString()}</div>
                    <div>{t("vehicle")}: {activeOngoing.vehicle.name} ({activeOngoing.vehicle.vehicleNumber})</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <Button variant="destructive" className="flex-1 md:flex-none border border-red-500/20 hover:bg-red-500/20" onClick={() => handleOpenIssue(activeOngoing.vehicleId)}>
                    <AlertTriangle className="h-4 w-4 mr-2" /> {t("report_issue")}
                  </Button>
                  <Button className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white" onClick={() => handleOpenClosing(activeOngoing)}>
                    <CheckCircle className="h-4 w-4 mr-2" /> {t("complete_trip")}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-border bg-card p-6 text-center text-muted-foreground glass">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-semibold">{t("no_active_trip")}</p>
              <p className="text-xs mt-1">{t("start_upcoming_desc")}</p>
            </Card>
          )}

          {/* Upcoming Assigned Journeys */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-primary" /> {t("upcoming_assignments")}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingAssigned.map((trip) => {
                const latestTrip = trip.vehicle.trips?.[0] || null;
                const latestParking = latestTrip?.parking || null;

                return (
                  <Card key={trip.id} className="border-border bg-card p-4 transition-all hover:border-primary/20">
                    <div className="flex justify-between items-start border-b border-border pb-2 mb-3">
                      <span className="font-mono text-xs font-semibold text-primary">{trip.tripNumber}</span>
                      <Badge variant="warning">{trip.status}</Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>{t("route")}: <span className="font-semibold text-foreground">{trip.pickup} ➔ {trip.destination}</span></div>
                      <div>{t("departure")}: <span className="text-muted-foreground">{new Date(trip.startTime).toLocaleString()}</span></div>
                      <div>{t("vehicle")}: <span className="font-semibold">{trip.vehicle.name} ({trip.vehicle.vehicleNumber})</span></div>
                      
                      {/* Vehicle Pickup Location */}
                      {latestParking ? (
                        <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                          <span className="font-semibold block text-primary text-[10px] mb-0.5">{t("car_pickup_location")}:</span>
                          <span className="block text-zinc-300 text-[10px]">{latestParking.location} ({latestParking.address})</span>
                        </div>
                      ) : (
                        <div className="mt-2 p-2 bg-muted/20 rounded-lg border border-border/40">
                          <span className="font-semibold block text-muted-foreground text-[10px] mb-0.5">{t("car_pickup_location")}:</span>
                          <span className="block text-muted-foreground italic text-[10px]">{t("base_depot_station")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border pt-3 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleOpenIssue(trip.vehicleId)}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> {t("flag_issue")}
                      </Button>
                      <Button size="sm" onClick={() => handleStartTrip(trip.id, trip.vehicleId)} disabled={!!activeOngoing || isPending}>
                        {t("start_journey")}
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {upcomingAssigned.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-2">{t("no_upcoming_trips")}</p>
              )}
            </div>
          </div>

          {/* Past Journeys History */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-primary" /> {t("trip_history")}
            </h3>
            <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trip_number")}</TableHead>
                  <TableHead>{t("route")}</TableHead>
                  <TableHead>{t("date_completed")}</TableHead>
                  <TableHead>{t("vehicle")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-xs font-semibold">{trip.tripNumber}</TableCell>
                    <TableCell className="text-xs">{trip.pickup} ➔ {trip.destination}</TableCell>
                    <TableCell className="text-xs">{new Date(trip.endTime).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{trip.vehicle.name} ({trip.vehicle.vehicleNumber})</TableCell>
                    <TableCell>
                      <Badge variant={trip.status === "COMPLETED" ? "success" : "secondary"}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {pastTrips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t("no_history")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </TableContainer>
          </div>
        </>
      ) : (
        /* Available Jobs Tab Content */
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-1.5">
              <Milestone className="h-4.5 w-4.5 text-primary" /> {t("available_jobs")}
            </h3>
            <p className="text-xs text-muted-foreground">Select an available job to assign to yourself and pick up the designated vehicle.</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {availableTrips.map((trip) => {
              const latestTrip = trip.vehicle.trips?.[0] || null;
              const latestParking = latestTrip?.parking || null;
              
              return (
                <Card key={trip.id} className="border-border bg-card p-4 transition-all hover:border-primary/20">
                  <div className="flex justify-between items-start border-b border-border pb-2 mb-3">
                    <span className="font-mono text-xs font-semibold text-primary">{trip.tripNumber}</span>
                    <Badge variant={trip.priority === "HIGH" ? "danger" : trip.priority === "MEDIUM" ? "warning" : "secondary"}>
                      {trip.priority}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div>{t("route")}: <span className="font-semibold text-foreground">{trip.pickup} ➔ {trip.destination}</span></div>
                    <div>{t("departure")}: <span className="text-muted-foreground">{new Date(trip.startTime).toLocaleString()}</span></div>
                    <div>{t("arrival")}: <span className="text-muted-foreground">{new Date(trip.endTime).toLocaleString()}</span></div>
                    <div>{t("vehicle")}: <span className="font-semibold text-foreground">{trip.vehicle.name} ({trip.vehicle.vehicleNumber})</span></div>
                    <div>{t("purpose")}: <span className="text-zinc-300 font-light">{trip.purpose}</span></div>
                    
                    {/* Vehicle Pickup Location */}
                    {latestParking ? (
                      <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                        <span className="font-semibold block text-primary mb-0.5 text-[10px]">{t("car_pickup_location")}:</span>
                        <span className="block text-zinc-300 text-[10px]">{latestParking.location} ({latestParking.address})</span>
                        {latestParking.landmark && <span className="block text-zinc-400 text-[9px]">Landmark: {latestParking.landmark}</span>}
                        {latestParking.googleMapsLink && (
                          <a
                            href={latestParking.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-primary hover:underline mt-1 font-semibold text-[9px]"
                          >
                            <Navigation className="h-2.5 w-2.5" /> {t("navigate_to_vehicle")}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-muted/20 rounded-lg border border-border/40">
                        <span className="font-semibold block text-muted-foreground mb-0.5 text-[10px]">{t("car_pickup_location")}:</span>
                        <span className="block text-muted-foreground italic text-[10px]">{t("base_depot_station")}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 border-t border-border pt-3 mt-4">
                    <Button size="sm" onClick={() => handleAcceptJob(trip.id)} disabled={isPending}>
                      {t("accept_job")}
                    </Button>
                  </div>
                </Card>
              );
            })}
            
            {availableTrips.length === 0 && (
              <p className="text-xs text-muted-foreground col-span-2">{t("no_available_jobs")}</p>
            )}
          </div>
        </div>
      )}

      {/* Complete Trip Wizard Dialog */}
      <Dialog isOpen={isClosingOpen} onClose={() => setIsClosingOpen(false)} title="Complete Trip Closing Module" className="max-w-xl">
        <form onSubmit={handleCloseSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex justify-between items-center text-xs font-semibold border-b border-border pb-3 mb-4">
            <span className={step === 1 ? "text-primary" : "text-muted-foreground"}>1. Odometer & Expenses</span>
            <span className={step === 2 ? "text-primary" : "text-muted-foreground"}>2. Parking Spot</span>
            <span className={step === 3 ? "text-primary" : "text-muted-foreground"}>3. Vehicle Check</span>
            <span className={step === 4 ? "text-primary" : "text-muted-foreground"}>4. Review</span>
          </div>

          {/* STEP 1: Odomenter & Expenses */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Starting Odometer (km)</label>
                  <Input type="number" value={closingData.startingOdometer} disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Ending Odometer (km)</label>
                  <Input
                    type="number"
                    value={closingData.endingOdometer || ""}
                    onChange={(e) => calculateDistance(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/20 rounded-lg text-xs flex justify-between items-center border border-border/40">
                <span className="text-muted-foreground font-semibold">Total Distance Travelled:</span>
                <span className="font-mono font-bold text-foreground">{closingData.distanceTravelled} km</span>
              </div>

              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">Claim Reimbursements</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Expense ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={closingData.fuelExpense || ""}
                    onChange={(e) => setClosingData({ ...closingData, fuelExpense: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Toll Expenses ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={closingData.tollExpense || ""}
                    onChange={(e) => setClosingData({ ...closingData, tollExpense: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parking Charges ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={closingData.parkingCharges || ""}
                    onChange={(e) => setClosingData({ ...closingData, parkingCharges: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Other Expenses ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={closingData.otherExpenses || ""}
                    onChange={(e) => setClosingData({ ...closingData, otherExpenses: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsClosingOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleNextStep}>Next Spot Details ➔</Button>
              </div>
            </div>
          )}

          {/* STEP 2: Parking Locator */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Parking Spot Name / Area</label>
                <Input
                  placeholder="Hinjewadi HQ Parking Zone B"
                  value={parkingData.location}
                  onChange={(e) => setParkingData({ ...parkingData, location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Full Address</label>
                <Input
                  placeholder="Plot 12, Sector 5, Hinjewadi, Pune"
                  value={parkingData.address}
                  onChange={(e) => setParkingData({ ...parkingData, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Landmark / Parking Slot Details</label>
                <Input
                  placeholder="Next to central cafeteria, Slot 45"
                  value={parkingData.landmark}
                  onChange={(e) => setParkingData({ ...parkingData, landmark: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Parking Location URL</label>
                <Input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={parkingData.googleMapsLink}
                  onChange={(e) => setParkingData({ ...parkingData, googleMapsLink: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="outline" onClick={handlePrevStep}>Back</Button>
                <Button type="button" onClick={handleNextStep}>Next Condition Check ➔</Button>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle Condition Report */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Ending Fuel Level</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={conditionData.fuelLevel}
                    onChange={(e) => setConditionData({ ...conditionData, fuelLevel: e.target.value })}
                  >
                    <option value="E">E (Empty)</option>
                    <option value="1/4">1/4 Tank</option>
                    <option value="1/2">1/2 Tank</option>
                    <option value="3/4">3/4 Tank</option>
                    <option value="F">F (Full)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tyre Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={conditionData.tyreCondition}
                    onChange={(e) => setConditionData({ ...conditionData, tyreCondition: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Worn">Worn</option>
                    <option value="Needs Replacement">Needs Replacement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Interior Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={conditionData.exteriorCondition}
                    onChange={(e) => setConditionData({ ...conditionData, exteriorCondition: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Scratches">Scratches</option>
                    <option value="Dents / Damage">Dents / Damage</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Damage Remarks / Notes (Optional)</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Detail any scratches, dents, or cleanliness issues..."
                  value={conditionData.remarks}
                  onChange={(e) => setConditionData({ ...conditionData, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="outline" onClick={handlePrevStep}>Back</Button>
                <Button type="button" onClick={handleNextStep}>Review & Confirm ➔</Button>
              </div>
            </div>
          )}

          {/* STEP 4: Review and submit */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Verify Submitted Claims</span>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Odometer:</span>
                  <span className="font-semibold">{closingData.startingOdometer} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ending Odometer:</span>
                  <span className="font-semibold">{closingData.endingOdometer} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance:</span>
                  <span className="font-semibold">{closingData.distanceTravelled} km</span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-2">
                  <span className="text-muted-foreground">Total Claimed Expenses:</span>
                  <span className="font-mono font-semibold">${(closingData.fuelExpense + closingData.tollExpense + closingData.parkingCharges + closingData.otherExpenses).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parking Spot:</span>
                  <span className="font-medium text-foreground">{parkingData.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle Tyres & Exterior:</span>
                  <span className="font-medium text-foreground">{conditionData.tyreCondition} / {conditionData.exteriorCondition}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isPending}>Back</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit Closing Data"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Dialog>

      {/* Report Breakdown / Issue Dialog */}
      <Dialog isOpen={isIssueOpen} onClose={() => setIsIssueOpen(false)} title="Report Vehicle Issue / Breakdown">
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              Warning: Submission of this form immediately marks the vehicle status as BREAKDOWN in company logs, flags dispatch managers, and pauses active trips.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Issue Description / Roadside Details</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe what went wrong: engine heat, tyre puncture, brake issue, towing requirements, current landmark..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Reporting..." : "Report Breakdown"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
