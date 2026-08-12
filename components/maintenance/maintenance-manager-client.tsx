"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Maintenance, Vehicle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { logMaintenance, completeMaintenance, deleteMaintenance } from "@/actions/maintenance";
import { Wrench, Plus, CheckCircle, Trash2, Calendar, DollarSign } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

interface MaintenanceManagerProps {
  logs: (Maintenance & {
    vehicle: Vehicle;
  })[];
  vehicles: Vehicle[];
}

export function MaintenanceManagerClient({ logs, vehicles }: MaintenanceManagerProps) {
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
    serviceHistory: "",
    nextServiceDate: "",
    oilChangeDone: false,
    tyresChanged: false,
    batteryChanged: false,
    repairCost: 0,
    garageDetails: "",
  });

  const handleOpenAdd = () => {
    setFormData({
      vehicleId: vehicles[0]?.id || "",
      serviceHistory: "",
      nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days default
      oilChangeDone: false,
      tyresChanged: false,
      batteryChanged: false,
      repairCost: 0,
      garageDetails: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await logMaintenance(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsFormOpen(false);
      }
    });
  };

  const handleComplete = (id: string, vehicleId: string) => {
    if (!confirm(t("complete_service_confirm"))) return;
    startTransition(async () => {
      const res = await completeMaintenance(id, vehicleId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("delete_maintenance_confirm"))) return;
    startTransition(async () => {
      const res = await deleteMaintenance(id);
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t("maintenance_manager")}</h2>
          <p className="text-sm text-muted-foreground">{t("maintenance_desc")}</p>
        </div>
        <Button onClick={handleOpenAdd} className="sm:self-start">
          <Plus className="h-4.5 w-4.5 mr-2" />
          {t("log_maintenance")}
        </Button>
      </div>

      {/* Maintenance Table */}
      <TableContainer>
        <TableHeader>
          <TableRow>
            <TableHead>{t("vehicle")}</TableHead>
            <TableHead>{t("service_details")}</TableHead>
            <TableHead>{t("next_service_date")}</TableHead>
            <TableHead>{t("replacements_done")}</TableHead>
            <TableHead>{t("cost")}</TableHead>
            <TableHead>{t("garage_location")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="font-semibold text-foreground">{log.vehicle.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{log.vehicle.vehicleNumber}</div>
                {log.vehicle.status === "MAINTENANCE" && (
                  <Badge variant="warning" className="mt-1">{t("in_workshop")}</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs" title={log.serviceHistory}>
                {log.serviceHistory}
              </TableCell>
              <TableCell>
                <div className="text-xs flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{mounted ? new Date(log.nextServiceDate).toLocaleDateString() : ""}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {log.oilChangeDone && <Badge variant="secondary">{t("oil_change")}</Badge>}
                  {log.tyresChanged && <Badge variant="secondary">{t("tyres")}</Badge>}
                  {log.batteryChanged && <Badge variant="secondary">{t("battery")}</Badge>}
                  {!log.oilChangeDone && !log.tyresChanged && !log.batteryChanged && (
                    <span className="text-xs text-muted-foreground">{t("general_repair")}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-red-600 dark:text-red-400">
                ${log.repairCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{log.garageDetails}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  {log.vehicle.status === "MAINTENANCE" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      onClick={() => handleComplete(log.id, log.vehicleId)}
                      title={t("mark_complete")}
                    >
                      <CheckCircle className="h-4.5 w-4.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {t("no_maintenance")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Log Service Event Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={t("log_maintenance")}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Select Vehicle</label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.vehicleNumber} - {v.status.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Service History / Remarks</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              placeholder="Detail the work done: replacement specs, clutch adjustment, filter changes..."
              value={formData.serviceHistory}
              onChange={(e) => setFormData({ ...formData, serviceHistory: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Repair Cost ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="450.00"
                value={formData.repairCost}
                onChange={(e) => setFormData({ ...formData, repairCost: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Next Service Due Date</label>
              <Input
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2 border border-border/40 p-3 rounded-lg bg-muted/20">
            <span className="block text-xs font-semibold text-muted-foreground mb-1">Parts Replaced</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                  checked={formData.oilChangeDone}
                  onChange={(e) => setFormData({ ...formData, oilChangeDone: e.target.checked })}
                />
                Oil Change
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                  checked={formData.tyresChanged}
                  onChange={(e) => setFormData({ ...formData, tyresChanged: e.target.checked })}
                />
                Tyres Upgraded
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                  checked={formData.batteryChanged}
                  onChange={(e) => setFormData({ ...formData, batteryChanged: e.target.checked })}
                />
                Battery Changed
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Garage Details (Workshop Name & Location)</label>
            <Input
              placeholder="Apex Auto Service Center, Lower Parel"
              value={formData.garageDetails}
              onChange={(e) => setFormData({ ...formData, garageDetails: e.target.value })}
              required
            />
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
