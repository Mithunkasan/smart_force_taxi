"use client";

import React, { useState, useEffect } from "react";
import { User, WeeklyLog } from "@prisma/client";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableContainer, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Clock, Eye, Calendar, Search, ArrowLeft, ExternalLink } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

// Define local extend types for weekly log with driver relation
type WeeklyLogWithDriver = WeeklyLog & {
  driver: User;
};

interface WeeklyLogAdminClientProps {
  initialLogs: WeeklyLogWithDriver[];
}

export function WeeklyLogAdminClient({ initialLogs }: WeeklyLogAdminClientProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [logs] = useState<WeeklyLogWithDriver[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<WeeklyLogWithDriver | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const name = (log.driver?.name || "").toLowerCase();
    const empId = (log.driver?.employeeId || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || empId.includes(query);
  });

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 text-foreground p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("weekly_log")} (Admin Review)</h2>
          <p className="text-sm text-muted-foreground">
            Review and monitor weekly work screenshots submitted by drivers.
          </p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Submissions Log</CardTitle>
              <CardDescription>
                A list of all weekly logs uploaded by fleet drivers.
              </CardDescription>
            </div>
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver or ID..."
                className="pl-9 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TableContainer>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Upload Date & Time</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/10">
                    <TableCell className="font-semibold text-foreground">
                      {log.driver?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {log.driver?.employeeId || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        {mounted ? (
                          <>
                            {new Date(log.uploadedAt).toLocaleDateString()} at {new Date(log.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : (
                          "Loading..."
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.driver?.phone || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-semibold flex items-center gap-1 hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                        <a 
                          href={log.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 self-center px-3"
                        >
                          Open Link <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic text-xs">
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Screenshot Preview Dialog */}
      {selectedLog && (
        <Dialog 
          isOpen={!!selectedLog} 
          onClose={() => setSelectedLog(null)} 
          title={`Screenshot review - ${selectedLog.driver?.name || "Driver"}`}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-muted/10 p-3 rounded-lg border border-border/40 text-xs flex justify-between">
              <div>
                <span className="text-muted-foreground font-semibold">Employee ID: </span>
                <span className="font-semibold">{selectedLog.driver?.employeeId}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Uploaded: </span>
                <span className="font-semibold">{mounted ? new Date(selectedLog.uploadedAt).toLocaleString() : "Loading..."}</span>
              </div>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden bg-black/40 flex items-center justify-center p-2">
              <img 
                src={selectedLog.imageUrl} 
                alt={`Screenshot uploaded by ${selectedLog.driver?.name}`}
                className="max-h-[500px] w-auto object-contain mx-auto rounded shadow-lg"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={() => setSelectedLog(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
