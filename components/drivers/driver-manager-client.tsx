"use client";

import React, { useState, useTransition } from "react";
import { User, Vehicle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createDriver, updateDriver, deleteDriver } from "@/actions/drivers";
import { Search, Plus, Edit2, Trash2, Eye, Calendar, ShieldAlert, Award } from "lucide-react";

interface DriverManagerProps {
  drivers: (User & {
    assignedVehicles: Vehicle[];
  })[];
  activeDriverIds: string[]; // IDs of drivers currently driving on a trip
}

export function DriverManagerClient({ drivers, activeDriverIds }: DriverManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active items
  const [selectedDriver, setSelectedDriver] = useState<(User & { assignedVehicles: Vehicle[] }) | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<User | null>(null);

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    experience: 0,
    shift: "Morning",
    emergencyContact: "",
    password: "",
  });

  const handleOpenAdd = () => {
    setDriverToEdit(null);
    setFormData({
      name: "",
      email: "",
      employeeId: "",
      phone: "",
      licenseNumber: "",
      licenseExpiry: new Date().toISOString().split("T")[0],
      experience: 0,
      shift: "Morning",
      emergencyContact: "",
      password: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (driver: User) => {
    setDriverToEdit(driver);
    setFormData({
      name: driver.name || "",
      email: driver.email || "",
      employeeId: driver.employeeId || "",
      phone: driver.phone || "",
      licenseNumber: driver.licenseNumber || "",
      licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split("T")[0] : "",
      experience: driver.experience || 0,
      shift: driver.shift || "Morning",
      emergencyContact: driver.emergencyContact || "",
      password: "", // Leave blank on edit
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (driver: User & { assignedVehicles: Vehicle[] }) => {
    setSelectedDriver(driver);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (driver: User & { assignedVehicles: Vehicle[] }) => {
    setSelectedDriver(driver);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      let res;
      if (driverToEdit) {
        res = await updateDriver(driverToEdit.id, {
          name: formData.name,
          email: formData.email,
          employeeId: formData.employeeId,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          experience: Number(formData.experience),
          shift: formData.shift,
          emergencyContact: formData.emergencyContact,
        });
      } else {
        res = await createDriver({
          name: formData.name,
          email: formData.email,
          employeeId: formData.employeeId,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          experience: Number(formData.experience),
          shift: formData.shift,
          emergencyContact: formData.emergencyContact,
          password: formData.password || undefined,
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
    if (!selectedDriver) return;
    startTransition(async () => {
      const res = await deleteDriver(selectedDriver.id);
      if (res.error) {
        alert(res.error);
      } else {
        setIsDeleteOpen(false);
      }
    });
  };

  // Filter drivers
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesShift = shiftFilter === "ALL" || d.shift === shiftFilter;
    
    return matchesSearch && matchesShift;
  });

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Drivers</h2>
          <p className="text-sm text-muted-foreground">Manage corporate driver accounts, credentials, and shift rosters.</p>
        </div>
        <Button onClick={handleOpenAdd} className="sm:self-start">
          <Plus className="h-4.5 w-4.5 mr-2" />
          Add New Driver
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, employee ID, license..."
            className="pl-10 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "Morning", "Evening", "Night"].map((shift) => (
            <Button
              key={shift}
              variant={shiftFilter === shift ? "default" : "secondary"}
              size="sm"
              onClick={() => setShiftFilter(shift)}
            >
              {shift} Shift
            </Button>
          ))}
        </div>
      </div>

      {/* Drivers Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>Driver Details</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Duty Status</TableHead>
            <TableHead>License Details</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Assigned Vehicle</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDrivers.map((driver) => {
            const isDriving = activeDriverIds.includes(driver.id);
            const statusLabel = isDriving ? "Driving" : "Available";

            return (
              <TableRow key={driver.id}>
                <TableCell>
                  <div className="font-semibold text-foreground">{driver.name}</div>
                  <div className="text-[10px] text-muted-foreground">Joined: {new Date(driver.createdAt).toLocaleDateString()}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{driver.employeeId}</TableCell>
                <TableCell>
                  <div className="text-xs">{driver.email}</div>
                  <div className="text-xs text-muted-foreground">{driver.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={isDriving ? "info" : "success"}>
                    {statusLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-mono">{driver.licenseNumber}</div>
                  {driver.licenseExpiry && (
                    <div className="text-[10px] text-muted-foreground">
                      Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs">{driver.shift || "N/A"}</TableCell>
                <TableCell>
                  {driver.assignedVehicles.length > 0 ? (
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">{driver.assignedVehicles[0].name}</span>
                      <span className="block text-[10px] font-mono text-muted-foreground">{driver.assignedVehicles[0].vehicleNumber}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDetails(driver)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(driver)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleOpenDelete(driver)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {filteredDrivers.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No drivers registered.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Add / Edit Form Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={driverToEdit ? "Edit Driver Profile" : "Register New Driver"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <Input
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Employee ID</label>
              <Input
                placeholder="DRV-001"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
              <Input
                placeholder="+15550100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {!driverToEdit && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Password (Credentials login)</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!driverToEdit}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">License Number</label>
              <Input
                placeholder="DL-12345ABC"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">License Expiry Date</label>
              <Input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Experience (Years)</label>
              <Input
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Shift Schedule</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Emergency Contact (Name & Phone)</label>
            <Input
              placeholder="Jane Doe (+15550103)"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Details View Dialog */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Driver Profile Diagnostics">
        {selectedDriver && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedDriver.name}</h3>
                <p className="text-sm text-muted-foreground">Employee ID: {selectedDriver.employeeId}</p>
              </div>
              <Badge variant={activeDriverIds.includes(selectedDriver.id) ? "info" : "success"} className="text-sm px-3 py-1">
                {activeDriverIds.includes(selectedDriver.id) ? "Driving" : "Available"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold">Experience</span>
                  <span className="text-sm">{selectedDriver.experience} Years</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold font-mono">Shift Hours</span>
                  <span className="text-sm">{selectedDriver.shift} Shift</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-primary" /> Credentials & Licenses
              </h4>
              <div className="space-y-2 bg-muted/40 p-4 rounded-xl border border-border/40 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Number:</span>
                  <span className="font-mono text-foreground font-semibold">{selectedDriver.licenseNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Expiry Date:</span>
                  <span className="font-semibold text-foreground">
                    {selectedDriver.licenseExpiry ? new Date(selectedDriver.licenseExpiry).toLocaleDateString("en-US", { dateStyle: "long" }) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-2 mt-2">
                  <span className="text-muted-foreground">Emergency Contact:</span>
                  <span className="font-medium text-foreground">{selectedDriver.emergencyContact || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{selectedDriver.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium text-foreground">{selectedDriver.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button onClick={() => setIsDetailsOpen(false)}>Close diagnostics</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="De-register Driver Account">
        {selectedDriver && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to de-register driver <span className="font-bold text-primary">{selectedDriver.name}</span> ({selectedDriver.employeeId})?
            </p>
            <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              Warning: This action will permanently delete the driver's corporate profile, credentials access, and any corresponding trip and attendance histories.
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
