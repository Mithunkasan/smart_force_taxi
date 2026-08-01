"use client";

import React, { useState, useTransition } from "react";
import { Vehicle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { reportVehicleIssue } from "@/actions/driver-trips";
import { Wrench, CheckCircle2, AlertCircle } from "lucide-react";

interface DriverIssuesClientProps {
  vehicles: Vehicle[];
  driverId: string;
}

export function DriverIssuesClient({ vehicles, driverId }: DriverIssuesClientProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || "");
  const [issueDescription, setIssueDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !issueDescription) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await reportVehicleIssue(selectedVehicleId, driverId, issueDescription);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setIssueDescription("");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Report Vehicle Issue</h2>
        <p className="text-sm text-muted-foreground">Log vehicle diagnostics issues, mechanical failures, or breakdowns.</p>
      </div>

      <Card className="border-border glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-1.5">
            <Wrench className="h-5 w-5 text-primary" /> Report Diagnostics Issue
          </CardTitle>
          <CardDescription>
            Reported issues will alert administrators and transition vehicle status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-600 dark:text-green-400 mb-4">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <p>Breakdown report submitted successfully. Roadside maintenance has been alerted.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/40">
              You are not currently assigned to any vehicle. Please check in with dispatch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Select Vehicle</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vehicleNumber} - Odo: {v.odometer} km)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Explain Issue / Breakdown details</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Detail symptoms: engine overheating, radiator leakage, tyre flat, clutch slip, exact location coordinates..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="destructive" className="w-full mt-2" disabled={isPending}>
                {isPending ? "Logging Report..." : "Submit Breakdown alert"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
