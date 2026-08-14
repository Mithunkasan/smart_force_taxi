"use client";

import React, { useState, useTransition } from "react";
import { Trip, User, Vehicle, TripClosing, VehicleConditionReport, ParkingLocation, AdminVerification, VerificationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { verifyTripData } from "@/actions/verification";
import { FileSearch, Check, AlertTriangle, XCircle, Eye, Info } from "lucide-react";

type VerificationTripType = Trip & {
  driver: User | null;
  vehicle: Vehicle;
  closing: TripClosing | null;
  conditionReport: VehicleConditionReport | null;
  parking: ParkingLocation | null;
  verification: AdminVerification | null;
};

interface VerificationManagerProps {
  trips: VerificationTripType[];
}

export function VerificationManagerClient({ trips }: VerificationManagerProps) {
  const [selectedTrip, setSelectedTrip] = useState<VerificationTripType | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Review states
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenDetails = (trip: VerificationTripType) => {
    setSelectedTrip(trip);
    setRemarks(trip.verification?.remarks || "");
    setErrorMsg(null);
    setIsDetailsOpen(true);
  };

  const handleSubmitVerification = (status: VerificationStatus) => {
    if (!selectedTrip) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await verifyTripData(selectedTrip.id, status, remarks);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsDetailsOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Trip Verifications</h2>
          <p className="text-sm text-muted-foreground">Compare company logs against driver receipts, verify expenses, and audit odometers.</p>
        </div>
      </div>

      {/* Verifications list */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Trip Number</TableHead>
            <TableHead>Driver & Vehicle</TableHead>
            <TableHead>Pickup ➔ Destination</TableHead>
            <TableHead>Odometer Check</TableHead>
            <TableHead>Total Claimed Expense</TableHead>
            <TableHead>Verification Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => {
            const hasClosing = !!trip.closing;
            const odometerDifference = trip.closing ? trip.closing.endingOdometer - trip.closing.startingOdometer : 0;
            const isOdoMismatch = trip.closing ? odometerDifference !== trip.closing.distanceTravelled : false;
            
            const totalExpenses = trip.closing
              ? trip.closing.fuelExpense + trip.closing.tollExpense + trip.closing.parkingCharges + trip.closing.otherExpenses + (trip.closing.allowance || 0)
              : 0;

            return (
              <TableRow key={trip.id}>
                <TableCell className="font-mono text-xs font-semibold">{trip.tripNumber}</TableCell>
                <TableCell>
                  <div className="text-xs font-semibold">{trip.driver?.name || "Unassigned"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{trip.vehicle.vehicleNumber}</div>
                </TableCell>
                <TableCell className="text-xs">
                  {trip.pickup} ➔ <span className="font-semibold">{trip.destination}</span>
                </TableCell>
                <TableCell>
                  {trip.closing ? (
                    <div className="text-xs">
                      <span>Entered: {trip.closing.distanceTravelled} km</span>
                      <span className="block text-[10px]">
                        Calculated: {odometerDifference} km{" "}
                        {isOdoMismatch ? (
                          <span className="text-red-500 font-bold font-mono">(! Mismatch)</span>
                        ) : (
                          <span className="text-green-500 font-bold font-mono">(✓ Match)</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No closing details</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">
                  ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      trip.verification?.status === "VERIFIED"
                        ? "success"
                        : trip.verification?.status === "MISMATCH"
                        ? "warning"
                        : trip.verification?.status === "REJECTED"
                        ? "danger"
                        : "secondary"
                    }
                  >
                    {trip.verification?.status || "PENDING"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDetails(trip)}>
                    <Eye className="h-4.5 w-4.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {trips.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No trips requiring verification at this time.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Details Comparison Dialog */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Audit Audit Comparison Sheet" className="max-w-2xl">
        {selectedTrip && selectedTrip.closing && (
          <div className="space-y-6">
            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            {/* General Trip Info */}
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold font-mono">{selectedTrip.tripNumber}</h3>
              <p className="text-xs text-muted-foreground">
                Driver: <span className="font-semibold text-foreground">{selectedTrip.driver?.name || "Unassigned"}</span> · Vehicle: <span className="font-semibold text-foreground">{selectedTrip.vehicle.name} ({selectedTrip.vehicle.vehicleNumber})</span>
              </p>
            </div>

            {/* Audit grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Company Records */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border pb-1.5 mb-2">Company Registry Logs</span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pre-trip Odometer:</span>
                    <span className="font-mono">{selectedTrip.closing.startingOdometer} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Active Vehicle Odometer:</span>
                    <span className="font-mono font-semibold">{selectedTrip.vehicle.odometer} km</span>
                  </div>
                   <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Driver Shift:</span>
                    <span>{selectedTrip.driver?.shift || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Driver Submitted Data */}
              <div className="space-y-4 bg-muted/40 p-4 rounded-xl border border-border/60">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border/60 pb-1.5 mb-2">Driver Submitted Claims</span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reported Start Odo:</span>
                    <span className="font-mono">{selectedTrip.closing.startingOdometer} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reported End Odo:</span>
                    <span className="font-mono">{selectedTrip.closing.endingOdometer} km</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border/40 pt-1.5">
                    <span className="text-muted-foreground">Claimed Travelled:</span>
                    <span className="font-mono">{selectedTrip.closing.distanceTravelled} km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Odometer discrepancies */}
            {selectedTrip.closing.endingOdometer - selectedTrip.closing.startingOdometer !== selectedTrip.closing.distanceTravelled && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <p className="font-medium">Odometer discrepancy! Calculated difference is {selectedTrip.closing.endingOdometer - selectedTrip.closing.startingOdometer} km but driver claimed {selectedTrip.closing.distanceTravelled} km.</p>
              </div>
            )}

            {/* Expense breakdown comparison */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Expense Claims audit</h4>
              <div className="bg-card border border-border rounded-xl p-4 text-xs space-y-2">
                <div className="grid grid-cols-4 font-bold border-b border-border pb-1.5 text-[10px] text-muted-foreground uppercase">
                  <div>Expense Type</div>
                  <div>Claimed Amount</div>
                  <div className="col-span-2">Invoice Receipts / Proofs</div>
                </div>
                <div className="grid grid-cols-4 py-1">
                  <div>Fuel Expense</div>
                  <div className="font-mono">${selectedTrip.closing.fuelExpense.toFixed(2)}</div>
                  <div className="col-span-2 text-muted-foreground italic">{selectedTrip.closing.billsUrl ? "File: fuel_receipt.jpg" : "No receipt uploaded"}</div>
                </div>
                <div className="grid grid-cols-4 py-1 border-t border-border/30">
                  <div>Toll Charges</div>
                  <div className="font-mono">${selectedTrip.closing.tollExpense.toFixed(2)}</div>
                  <div className="col-span-2 text-muted-foreground italic">{selectedTrip.closing.receiptsUrl ? "File: toll_ticket.png" : "No receipt uploaded"}</div>
                </div>
                <div className="grid grid-cols-4 py-1 border-t border-border/30">
                  <div>Parking Fees</div>
                  <div className="font-mono">${selectedTrip.closing.parkingCharges.toFixed(2)}</div>
                  <div className="col-span-2 text-muted-foreground italic">Self-claimed</div>
                </div>
                <div className="grid grid-cols-4 py-1 border-t border-border/30">
                  <div>Driver Allowance</div>
                  <div className="font-mono">${(selectedTrip.closing.allowance || 0).toFixed(2)}</div>
                  <div className="col-span-2 text-muted-foreground italic">Self-claimed</div>
                </div>
                <div className="grid grid-cols-4 py-1 border-t border-border/30 font-bold border-b border-border/40 pb-2">
                  <div>Other Extras</div>
                  <div className="font-mono">${selectedTrip.closing.otherExpenses.toFixed(2)}</div>
                  <div className="col-span-2 text-muted-foreground italic">Remarks: {selectedTrip.closing.remarks || "None"}</div>
                </div>
              </div>
            </div>

            {/* Vehicle Condition and Parking Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {selectedTrip.conditionReport && (
                <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-muted/10">
                  <span className="font-semibold block text-[10px] uppercase text-muted-foreground">Vehicle Condition Report</span>
                  <div>Fuel Level: <span className="font-medium text-foreground">{selectedTrip.conditionReport.fuelLevel}</span></div>
                  <div>Tyres: <span className="font-medium text-foreground">{selectedTrip.conditionReport.tyreCondition}</span></div>
                  <div>Interior: <span className="font-medium text-foreground">{selectedTrip.conditionReport.interiorCondition}</span></div>
                  <div>Exterior: <span className="font-medium text-foreground">{selectedTrip.conditionReport.exteriorCondition}</span></div>
                </div>
              )}
              {selectedTrip.parking && (
                <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-muted/10">
                  <span className="font-semibold block text-[10px] uppercase text-muted-foreground">Parking Location Details</span>
                  <div>Location: <span className="font-medium text-foreground">{selectedTrip.parking.location}</span></div>
                  <div className="truncate" title={selectedTrip.parking.address}>Address: <span className="text-muted-foreground">{selectedTrip.parking.address}</span></div>
                  {selectedTrip.parking.googleMapsLink && (
                    <a href={selectedTrip.parking.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] block font-semibold mt-1">
                      View Google Maps Location ➔
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Audit actions */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Verification Review Audit Remarks</label>
                <Input
                  placeholder="Enter remarks for driver verification logs (e.g. Fuel receipt matches standard rates)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Current Status: <span className="font-semibold">{selectedTrip.verification?.status || "PENDING"}</span>
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/10" onClick={() => handleSubmitVerification("MISMATCH")} disabled={isPending}>
                    <AlertTriangle className="h-4 w-4 mr-1.5" /> Flag Mismatch
                  </Button>
                  <Button variant="destructive" onClick={() => handleSubmitVerification("REJECTED")} disabled={isPending}>
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject Claims
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSubmitVerification("VERIFIED")} disabled={isPending}>
                    <Check className="h-4 w-4 mr-1.5" /> Approve & Verify
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
