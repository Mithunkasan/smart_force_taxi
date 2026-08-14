"use client";

import React, { useState, useEffect, useTransition } from "react";
import { FuelLog, Vehicle, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { logFuel, deleteFuelLog } from "@/actions/fuel";
import { Fuel, Plus, Trash2, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

interface FuelManagerProps {
  logs: (FuelLog & {
    vehicle: Vehicle;
    driver: User;
  })[];
  vehicles: Vehicle[];
  drivers: User[];
}

export function FuelManagerClient({ logs, vehicles, drivers }: FuelManagerProps) {
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: vehicles[0]?.id || "",
    driverId: drivers[0]?.id || "",
    quantity: 0,
    cost: 0,
    odometer: 0,
  });

  const handleOpenAdd = () => {
    // Select first vehicle
    const firstVehicle = vehicles[0];
    setFormData({
      vehicleId: firstVehicle?.id || "",
      driverId: drivers[0]?.id || "",
      quantity: 0,
      cost: 0,
      odometer: firstVehicle ? firstVehicle.odometer : 0,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleVehicleChange = (vehicleId: string) => {
    const v = vehicles.find((veh) => veh.id === vehicleId);
    setFormData({
      ...formData,
      vehicleId,
      odometer: v ? v.odometer : 0,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await logFuel(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsFormOpen(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("delete_fuel_confirm"))) return;
    startTransition(async () => {
      const res = await deleteFuelLog(id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t("fuel_manager")}</h2>
          <p className="text-sm text-muted-foreground">{t("fuel_desc")}</p>
        </div>
        <Button onClick={handleOpenAdd} className="sm:self-start">
          <Plus className="h-4.5 w-4.5 mr-2" />
          {t("log_refuel")}
        </Button>
      </div>

      {/* Fuel logs table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>{t("refuel_date")}</TableHead>
            <TableHead>{t("vehicle")}</TableHead>
            <TableHead>{t("driver")}</TableHead>
            <TableHead>{t("amount_litres")}</TableHead>
            <TableHead>{t("cost")}</TableHead>
            <TableHead>{t("efficiency")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="text-xs flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {mounted ? (
                      <>
                        {new Date(log.date).toLocaleDateString()} ·{" "}
                        {new Date(log.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </>
                    ) : (
                      ""
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-foreground">{log.vehicle.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{log.vehicle.vehicleNumber}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs font-semibold">{log.driver.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{log.driver.employeeId}</div>
              </TableCell>
              <TableCell className="font-mono text-xs">{log.quantity} L</TableCell>
              <TableCell className="font-mono text-xs font-semibold text-foreground">
                ${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge variant="info" className="font-mono">
                  {log.mileage} km/L
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {t("no_refuel_events")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Log Refuel Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t("log_refuel")}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Select Vehicle</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vehicleNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Refueling Driver</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                required
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Quantity (Liters)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="45.5"
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Total Cost ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="80.00"
                value={formData.cost || ""}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Odometer (km)</label>
              <Input
                type="number"
                value={formData.odometer || ""}
                onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Logging..." : "Confirm Log"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
