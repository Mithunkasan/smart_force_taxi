"use client";

import React, { useState, useEffect } from "react";
import { User, WeeklyLog } from "@prisma/client";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, UploadCloud, Calendar, Eye, Clock } from "lucide-react";
import { uploadWeeklyScreenshotAction, getDriverWeeklyLogsAction } from "@/actions/weekly-logs";
import { useTranslation } from "@/components/layout/language-provider";

interface WeeklyLogClientProps {
  driver: User;
  initialLogs: WeeklyLog[];
}

export function WeeklyLogClient({ driver, initialLogs }: WeeklyLogClientProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<WeeklyLog[]>(initialLogs);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isSunday = new Date().getDay() === 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if driver has uploaded a log today
  const hasUploadedToday = logs.some((log) => {
    const uploadDate = new Date(log.uploadedAt).toDateString();
    const todayDate = new Date().toDateString();
    return uploadDate === todayDate;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please select an image file (PNG, JPG, JPEG)" });
        return;
      }
      // Limit to 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));

      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!base64Image) {
      setMessage({ type: "error", text: "Please select an image first." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await uploadWeeklyScreenshotAction(driver.id, base64Image);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Weekly work screenshot uploaded successfully!" });
        setFile(null);
        setPreviewUrl(null);
        setBase64Image(null);
        
        // Refresh logs list
        const refreshed = await getDriverWeeklyLogsAction(driver.id);
        if (refreshed.logs) {
          setLogs(refreshed.logs);
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload log." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6 text-foreground p-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("weekly_log")}</h2>
        <p className="text-sm text-muted-foreground">
          Upload and track your weekly work screenshot logs for manager review.
        </p>
      </div>

      {/* Sunday Notification Banner */}
      {isSunday && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          hasUploadedToday 
            ? "bg-green-500/10 border-green-500/20 text-green-500" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse"
        }`}>
          {hasUploadedToday ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-bold">{isSunday ? "Sunday Upload Reminder" : "Weekly Report Status"}</h4>
            <p className="text-xs mt-1">
              {hasUploadedToday 
                ? "Excellent! You have successfully submitted your weekly work screenshot for today."
                : "Today is Sunday. Please capture your weekly work statement and upload it below before the end of the day."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Screenshot Panel */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Weekly Screenshot
            </CardTitle>
            <CardDescription>
              Select your work log screenshot. Maximum size: 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  message.type === "success" 
                    ? "bg-green-500/10 border-green-500/20 text-green-500" 
                    : "bg-red-500/10 border-red-500/20 text-red-500"
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{message.text}</p>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors relative cursor-pointer group bg-muted/10">
                <input
                  type="file"
                  id="screenshot-file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                {previewUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={previewUrl} 
                      alt="Screenshot preview" 
                      className="max-h-48 mx-auto object-contain rounded-lg shadow-md border border-border"
                    />
                    <p className="text-xs text-muted-foreground font-semibold">Click or drag to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold">Click to browse or drag file here</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-white font-semibold shadow-sm hover:glow-primary"
                disabled={isLoading || !base64Image}
              >
                {isLoading ? "Uploading screenshot..." : "Upload Weekly Log"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Upload History List */}
        <Card className="border-border bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Upload Logs History
            </CardTitle>
            <CardDescription>
              Your past work screenshot submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px]">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {mounted ? new Date(log.uploadedAt).toLocaleDateString() : ""}
                    </div>
                    <span className="text-muted-foreground block text-[10px]">
                      Uploaded at {mounted ? new Date(log.uploadedAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <a 
                    href={log.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 text-primary hover:underline font-bold shrink-0 text-[11px]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Screenshot
                  </a>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-10 text-muted-foreground italic text-xs">
                  No weekly logs uploaded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
