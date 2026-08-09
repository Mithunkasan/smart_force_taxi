"use client";

import React, { useState, useTransition } from "react";
import { Trip, User, Vehicle, TripStatus, Priority } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createTrip, updateTrip, deleteTrip } from "@/actions/trips";
import { Search, Plus, Edit2, Trash2, Eye, MapPin, Calendar, Clock, AlertCircle } from "lucide-react";

interface TripManagerProps {
  trips: (Trip & {
    driver: User | null;
    vehicle: Vehicle;
  })[];
  drivers: User[];
  vehicles: Vehicle[];
}

export function TripManagerClient({ trips, drivers, vehicles }: TripManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active items
  const [selectedTrip, setSelectedTrip] = useState<(Trip & { driver: User | null; vehicle: Vehicle }) | null>(null);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tripNumber: "",
    requestedBy: "",
    department: "",
    pickup: "",
    destination: "",
    startTime: "",
    endTime: "",
    purpose: "",
    priority: "MEDIUM" as Priority,
    driverId: "",
    vehicleId: "",
    status: "PENDING" as TripStatus,
    notes: "",
  });

  const handleOpenAdd = () => {
    setTripToEdit(null);
    // Generate a random unique trip number
    const randomNum = "TRP-" + Math.floor(1000 + Math.random() * 9000);
    setFormData({
      tripNumber: randomNum,
      requestedBy: "",
      department: "",
      pickup: "",
      destination: "",
      startTime: "",
      endTime: "",
      purpose: "",
      priority: "MEDIUM",
      driverId: "",
      vehicleId: vehicles[0]?.id || "",
      status: "PENDING",
      notes: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setTripToEdit(trip);
    setFormData({
      tripNumber: trip.tripNumber,
      requestedBy: trip.requestedBy || "",
      department: trip.department || "",
      pickup: trip.pickup,
      destination: trip.destination,
      startTime: new Date(trip.startTime).toISOString().slice(0, 16),
      endTime: new Date(trip.endTime).toISOString().slice(0, 16),
      purpose: trip.purpose,
      priority: trip.priority,
      driverId: trip.driverId || "",
      vehicleId: trip.vehicleId,
      status: trip.status,
      notes: trip.notes || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (trip: Trip & { driver: User | null; vehicle: Vehicle }) => {
    setSelectedTrip(trip);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (trip: Trip & { driver: User | null; vehicle: Vehicle }) => {
    setSelectedTrip(trip);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      let res;
      if (tripToEdit) {
        res = await updateTrip(tripToEdit.id, formData);
      } else {
        res = await createTrip(formData);
      }

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsFormOpen(false);
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!selectedTrip) return;
    startTransition(async () => {
      const res = await deleteTrip(selectedTrip.id);
      if (res.error) {
        alert(res.error);
      } else {
        setIsDeleteOpen(false);
      }
    });
  };

  // Filter trips
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.requestedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.driver?.name || "Unassigned").toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Trips & Dispatch</h2>
          <p className="text-sm text-muted-foreground">Monitor routes, check active driver rosters, and verify trip diagnostics.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search by trip number, pickup, destination, driver..."
            className="pl-10 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PENDING", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize text-xs"
            >
              {status.toLowerCase().replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Trips Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Trip Number</TableHead>
            <TableHead>Requestor</TableHead>
            <TableHead>Route Details</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Driver & Vehicle</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-mono text-xs font-semibold">{trip.tripNumber}</TableCell>
              <TableCell>
                <div className="text-xs font-semibold">{trip.requestedBy}</div>
                <div className="text-[10px] text-muted-foreground">{trip.department}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="truncate max-w-[120px]">{trip.pickup}</span>
                </div>
                <div className="text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                  <span className="truncate max-w-[120px] font-semibold">{trip.destination}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>Start: {new Date(trip.startTime).toLocaleDateString()} {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>End: {new Date(trip.endTime).toLocaleDateString()} {new Date(trip.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <span className="font-medium text-foreground">{trip.driver?.name || "Unassigned"}</span>
                  <span className="block text-[10px] text-muted-foreground font-mono">{trip.vehicle.vehicleNumber} ({trip.vehicle.name})</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={trip.priority === "HIGH" ? "danger" : trip.priority === "MEDIUM" ? "warning" : "secondary"}>
                  {trip.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    trip.status === "COMPLETED"
                      ? "success"
                      : trip.status === "IN_PROGRESS"
                      ? "info"
                      : trip.status === "ACCEPTED"
                      ? "warning"
                      : trip.status === "CANCELLED"
                      ? "secondary"
                      : "warning"
                  }
                >
                  {trip.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDetails(trip)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {trip.status !== "COMPLETED" && trip.status !== "CANCELLED" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(trip)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleOpenDelete(trip)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredTrips.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No trips scheduled.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Add / Edit Form Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={tripToEdit ? "Edit Trip Details" : "Schedule New Journey"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 flex items-start gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Trip ID (Autogenerated)</label>
              <Input value={formData.tripNumber} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Priority</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Requested By</label>
              <Input
                placeholder="Marketing Manager"
                value={formData.requestedBy}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Department</label>
              <Input
                placeholder="Sales & Distribution"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Pickup Location</label>
              <Input
                placeholder="Delhi Corporate HQ"
                value={formData.pickup}
                onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Destination Location</label>
              <Input
                placeholder="Gurgaon Retail Outlet"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Start Time</label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Estimated End Time</label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Assign Vehicle</label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} ({v.name} - Odo: {v.odometer} km)
                </option>
              ))}
            </select>
          </div>

          {tripToEdit && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Trip Status</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TripStatus })}
              >
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Purpose of Trip</label>
            <Input
              placeholder="Delivery of raw components"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Administrative Notes (Optional)</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              placeholder="Enter special logistics requirements..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Details View Dialog */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Trip Diagnostics">
        {selectedTrip && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold font-mono text-primary">{selectedTrip.tripNumber}</h3>
                <p className="text-sm text-muted-foreground">Requested by: {selectedTrip.requestedBy} ({selectedTrip.department})</p>
              </div>
              <Badge variant={selectedTrip.status === "COMPLETED" ? "success" : "info"} className="text-sm px-3 py-1">
                {selectedTrip.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-muted/40 p-4 rounded-xl border border-border/40">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Driver Details</span>
                <div>
                  {selectedTrip.driver ? (
                    <>
                      <span className="font-semibold block text-sm">{selectedTrip.driver.name}</span>
                      <span className="block text-muted-foreground">{selectedTrip.driver.email}</span>
                      <span className="block text-muted-foreground font-mono">Employee: {selectedTrip.driver.employeeId}</span>
                    </>
                  ) : (
                    <span className="font-semibold block text-sm italic text-muted-foreground">Unassigned (Available)</span>
                  )}
                </div>
              </div>
              <div className="space-y-2 bg-muted/40 p-4 rounded-xl border border-border/40">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Vehicle Diagnostics</span>
                <div>
                  <span className="font-semibold block text-sm">{selectedTrip.vehicle.name}</span>
                  <span className="block text-muted-foreground font-mono">{selectedTrip.vehicle.vehicleNumber}</span>
                  <span className="block text-muted-foreground">Odometer: {selectedTrip.vehicle.odometer.toLocaleString()} km</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider">Logistics Summary</h4>
              <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route:</span>
                  <span className="font-semibold">{selectedTrip.pickup} ➔ {selectedTrip.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departure:</span>
                  <span>{new Date(selectedTrip.startTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Arrival:</span>
                  <span>{new Date(selectedTrip.endTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                  <span className="text-muted-foreground font-semibold">Purpose:</span>
                  <span>{selectedTrip.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Assigned By:</span>
                  <span className="font-semibold">{selectedTrip.assignedBy || "ADMIN"}</span>
                </div>
                {selectedTrip.startGpsUrl && (
                  <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                    <span className="text-muted-foreground font-semibold">Start GPS:</span>
                    <a href={selectedTrip.startGpsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                      View Start Location ↗
                    </a>
                  </div>
                )}
                {selectedTrip.destinationGpsUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Destination GPS:</span>
                    <a href={selectedTrip.destinationGpsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                      View Destination ↗
                    </a>
                  </div>
                )}
                {selectedTrip.actualStartTime && (
                  <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                    <span className="text-muted-foreground">Actual Start:</span>
                    <span>{new Date(selectedTrip.actualStartTime).toLocaleString()}</span>
                  </div>
                )}
                {selectedTrip.actualEndTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual End:</span>
                    <span>{new Date(selectedTrip.actualEndTime).toLocaleString()}</span>
                  </div>
                )}
                {selectedTrip.durationMinutes !== null && selectedTrip.durationMinutes !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{selectedTrip.durationMinutes} minutes</span>
                  </div>
                )}
                {selectedTrip.notes && (
                  <div className="border-t border-border/50 pt-2 mt-2">
                    <span className="block text-muted-foreground font-semibold mb-1">Notes:</span>
                    <p className="text-muted-foreground bg-card p-2 rounded border border-border/40">{selectedTrip.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={() => setIsDetailsOpen(false)}>Close Diagnostics</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Cancel & Delete Trip Schedule">
        {selectedTrip && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to cancel and delete trip <span className="font-bold text-primary">{selectedTrip.tripNumber}</span>?
            </p>
            <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              Warning: This action will permanently remove this trip record from dispatch registers. Associated vehicles and drivers will be freed.
            </p>
            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isPending}>
                {isPending ? "Cancelling..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
