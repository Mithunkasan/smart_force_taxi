"use client";

import React, { useState, useTransition } from "react";
import { Vehicle, User, VehicleStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createVehicle, updateVehicle, deleteVehicle } from "@/actions/vehicles";
import { Search, Plus, Edit2, Trash2, Eye, Calendar, UserCheck, Milestone } from "lucide-react";

interface VehicleManagerProps {
  vehicles: (Vehicle & {
    currentDriver: User | null;
  })[];
  drivers: User[];
}

export function VehicleManagerClient({ vehicles, drivers }: VehicleManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Active items
  const [selectedVehicle, setSelectedVehicle] = useState<(Vehicle & { currentDriver: User | null }) | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    seatingCapacity: 5,
    registrationNumber: "",
    insuranceExpiry: "",
    fcExpiry: "",
    pollutionExpiry: "",
    serviceDueDate: "",
    odometer: 0,
    status: "AVAILABLE" as VehicleStatus,
    currentDriverId: "",
    carType: "Sedan",
    ownershipType: "Own",
    notes: "",
  });

  const handleOpenAdd = () => {
    setVehicleToEdit(null);
    setFormData({
      vehicleNumber: "",
      name: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      seatingCapacity: 5,
      registrationNumber: "",
      insuranceExpiry: new Date().toISOString().split("T")[0],
      fcExpiry: new Date().toISOString().split("T")[0],
      pollutionExpiry: new Date().toISOString().split("T")[0],
      serviceDueDate: new Date().toISOString().split("T")[0],
      odometer: 0,
      status: "AVAILABLE",
      currentDriverId: "",
      carType: "Sedan",
      ownershipType: "Own",
      notes: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      seatingCapacity: vehicle.seatingCapacity,
      registrationNumber: vehicle.registrationNumber,
      insuranceExpiry: new Date(vehicle.insuranceExpiry).toISOString().split("T")[0],
      fcExpiry: new Date(vehicle.fcExpiry).toISOString().split("T")[0],
      pollutionExpiry: new Date(vehicle.pollutionExpiry).toISOString().split("T")[0],
      serviceDueDate: new Date(vehicle.serviceDueDate).toISOString().split("T")[0],
      odometer: vehicle.odometer,
      status: vehicle.status,
      currentDriverId: vehicle.currentDriverId || "",
      carType: vehicle.carType || "Sedan",
      ownershipType: vehicle.ownershipType || "Own",
      notes: vehicle.notes || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (vehicle: Vehicle & { currentDriver: User | null }) => {
    setSelectedVehicle(vehicle);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (vehicle: Vehicle & { currentDriver: User | null }) => {
    setSelectedVehicle(vehicle);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      let res;
      if (vehicleToEdit) {
        res = await updateVehicle(vehicleToEdit.id, {
          ...formData,
          year: Number(formData.year),
          seatingCapacity: Number(formData.seatingCapacity),
          odometer: Number(formData.odometer),
        });
      } else {
        res = await createVehicle({
          ...formData,
          year: Number(formData.year),
          seatingCapacity: Number(formData.seatingCapacity),
          odometer: Number(formData.odometer),
        });
      }

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsFormOpen(false);
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!selectedVehicle) return;
    startTransition(async () => {
      const res = await deleteVehicle(selectedVehicle.id);
      if (res.error) {
        alert(res.error);
      } else {
        setIsDeleteOpen(false);
      }
    });
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.carType && v.carType.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getVehicleStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">Available</Badge>;
      case "ASSIGNED":
        return <Badge variant="secondary">Assigned</Badge>;
      case "ON_TRIP":
        return <Badge variant="info">On Trip</Badge>;
      case "MAINTENANCE":
        return <Badge variant="warning">Maintenance</Badge>;
      case "OFFLINE":
      default:
        return <Badge variant="danger">Offline</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Register Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Cars / Vehicles</h2>
          <p className="text-sm text-muted-foreground">Manage your vehicle registry, ownership status, and maintenance diagnostics.</p>
        </div>
        <Button onClick={handleOpenAdd} className="sm:self-start">
          <Plus className="h-4.5 w-4.5 mr-2" />
          Register Car
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search by plate number, model, brand, type..."
            className="pl-10 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "AVAILABLE", "ASSIGNED", "ON_TRIP", "MAINTENANCE", "OFFLINE"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status.toLowerCase().replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Vehicles Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Car Details</TableHead>
            <TableHead>Plate Number</TableHead>
            <TableHead>Car Type</TableHead>
            <TableHead>Own / Rental</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Odometer</TableHead>
            <TableHead>Current Driver</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div className="font-semibold text-foreground">{vehicle.name}</div>
                <div className="text-xs text-muted-foreground">
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-xs font-bold">{vehicle.vehicleNumber}</div>
                <div className="text-[10px] text-muted-foreground">{vehicle.registrationNumber}</div>
              </TableCell>
              <TableCell className="text-xs">
                {vehicle.carType || "N/A"}
              </TableCell>
              <TableCell className="text-xs">
                <Badge variant={vehicle.ownershipType === "Own" ? "default" : "secondary"}>
                  {vehicle.ownershipType || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                {getVehicleStatusBadge(vehicle.status)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {vehicle.odometer.toLocaleString()} km
              </TableCell>
              <TableCell>
                {vehicle.currentDriver ? (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">{vehicle.currentDriver.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{vehicle.currentDriver.employeeId}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDetails(vehicle)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(vehicle)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleOpenDelete(vehicle)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredVehicles.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No vehicles found matching filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Add / Edit Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={vehicleToEdit ? "Edit Vehicle" : "Register Vehicle"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Plate Number (Vehicle Number)</label>
              <Input
                placeholder="TN 01 AB 1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
              <Input
                placeholder="Toyota Etios"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Brand</label>
              <Input
                placeholder="Toyota"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Car Model</label>
              <Input
                placeholder="Etios Liva"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Year</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Car Type (e.g. Sedan, SUV)</label>
              <Input
                placeholder="Sedan"
                value={formData.carType}
                onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Own / Rental</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.ownershipType}
                onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
              >
                <option value="Own">Own (Owned)</option>
                <option value="Rental">Rental</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Registration No.</label>
              <Input
                placeholder="REG-TN01AB1234"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Seating Capacity</label>
              <Input
                type="number"
                value={formData.seatingCapacity}
                onChange={(e) => setFormData({ ...formData, seatingCapacity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Odometer (km)</label>
              <Input
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Insurance Expiry</label>
              <Input
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fitness Cert (FC) Expiry</label>
              <Input
                type="date"
                value={formData.fcExpiry}
                onChange={(e) => setFormData({ ...formData, fcExpiry: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Pollution Cert Expiry</label>
              <Input
                type="date"
                value={formData.pollutionExpiry}
                onChange={(e) => setFormData({ ...formData, pollutionExpiry: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Service Due Date</label>
              <Input
                type="date"
                value={formData.serviceDueDate}
                onChange={(e) => setFormData({ ...formData, serviceDueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Vehicle Status</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
              >
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Assign Driver</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.currentDriverId}
                onChange={(e) => setFormData({ ...formData, currentDriverId: e.target.value })}
              >
                <option value="">No Driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Notes / Remarks</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              placeholder="Enter notes about vehicle usage, service requirements..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Vehicle"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Details Dialog */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Vehicle Diagnostics & Certificates">
        {selectedVehicle && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedVehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</p>
              </div>
              {getVehicleStatusBadge(selectedVehicle.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Milestone className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Odometer</span>
                  <span className="font-mono text-sm">{selectedVehicle.odometer.toLocaleString()} km</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Current Driver</span>
                  <span className="text-sm">{selectedVehicle.currentDriver?.name || "Unassigned"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
              <div>
                <span className="text-muted-foreground block">Car Type:</span>
                <span className="font-semibold text-foreground">{selectedVehicle.carType || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Ownership Type:</span>
                <span className="font-semibold text-foreground">{selectedVehicle.ownershipType || "N/A"}</span>
              </div>
            </div>

            {selectedVehicle.notes && (
              <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-xs">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Notes</span>
                <p className="text-foreground italic">{selectedVehicle.notes}</p>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-primary" /> Certificate Expiry Dates
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs bg-muted/40 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="block text-muted-foreground">Insurance:</span>
                  <span className="font-medium text-foreground">{new Date(selectedVehicle.insuranceExpiry).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Fitness Certificate (FC):</span>
                  <span className="font-medium text-foreground">{new Date(selectedVehicle.fcExpiry).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Pollution Control:</span>
                  <span className="font-medium text-foreground">{new Date(selectedVehicle.pollutionExpiry).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Next Scheduled Service:</span>
                  <span className="font-medium text-foreground">{new Date(selectedVehicle.serviceDueDate).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button onClick={() => setIsDetailsOpen(false)}>Close Diagnostics</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="De-register Vehicle">
        {selectedVehicle && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to de-register vehicle <span className="font-bold text-primary">{selectedVehicle.vehicleNumber}</span> ({selectedVehicle.name})?
            </p>
            <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              Warning: This action will permanently remove the vehicle record and all associated maintenance, fuel, and trip histories.
            </p>
            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isPending}>
                {isPending ? "De-registering..." : "Confirm De-register"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
