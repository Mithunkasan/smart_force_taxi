"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { User, Vehicle, Trip } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { bookCarAction } from "@/actions/driver-trips";
import { Clock, Calendar, CalendarDays, AlertCircle, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "@/components/layout/language-provider";
import { useRouter } from "next/navigation";

interface DriverDashboardClientProps {
  driver: User;
  activeShift: any | null;
  assignedVehicle: Vehicle | null;
  vehicles: Vehicle[];
  bookings: (Trip & { driver?: User | null; vehicle?: Vehicle | null })[];
  activeTrip: (Trip & { vehicle: Vehicle }) | null;
}

export function DriverDashboardClient({
  driver,
  activeShift,
  assignedVehicle,
  vehicles,
  bookings,
  activeTrip,
}: DriverDashboardClientProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<"ALL" | "AVAILABLE" | "ON_TRIP">("ALL");
  // Dates: 7-day default window; showAllDates toggles full calendar mode
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllDates, setShowAllDates] = useState(false);
  // Displayed dates: ±3 around selected if selected ≠ today, else 7-day window
  const [windowDates, setWindowDates] = useState<Date[]>([]);

  // Live bookings state for real-time slot availability
  const [liveBookings, setLiveBookings] = useState<(Trip & { driver?: User | null; vehicle?: Vehicle | null })[]>(bookings);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [bookingTimes, setBookingTimes] = useState({
    startTime: "",
    endTime: "",
    pickup: "",
    destination: "",
    purpose: "Corporate Duty",
  });
  const [clickedBookedSlot, setClickedBookedSlot] = useState<any | null>(null);
  const [showSundayPopup, setShowSundayPopup] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const preselectedVehicleId = params.get("vehicleId");
    if (preselectedVehicleId) {
      const match = vehicles.find((v) => v.id === preselectedVehicleId);
      if (match) {
        setSelectedVehicle(match);
      }
    } else if (assignedVehicle) {
      setSelectedVehicle(assignedVehicle);
    }

    // Generate dates list (7 days)
    const list: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    setWindowDates(list);

    // Sunday Popup check
    if (new Date().getDay() === 0) {
      const dismissed = sessionStorage.getItem("sunday_popup_dismissed");
      if (!dismissed) {
        setShowSundayPopup(true);
      }
    }
  }, [vehicles]);

  // When selectedDate changes (and showAllDates is off), update window to ±3 days
  useEffect(() => {
    if (showAllDates) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    const isToday = sel.getTime() === today.getTime();

    if (isToday) {
      // Show 7-day window from today
      const list: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        list.push(d);
      }
      setWindowDates(list);
    } else {
      // Show ±3 days around selected date
      const window: Date[] = [];
      for (let i = -3; i <= 3; i++) {
        const d = new Date(sel);
        d.setDate(sel.getDate() + i);
        window.push(d);
      }
      setWindowDates(window);
    }
  }, [selectedDate, showAllDates]);

  // Helper: fetch live bookings for active vehicle
  const fetchLiveBookings = useCallback(async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/bookings?vehicleId=${vehicleId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.bookings) {
        setLiveBookings(data.bookings);
        setLastRefreshed(new Date());
      }
    } catch {
      // silently ignore network errors
    }
  }, []);

  // Poll for live bookings every 20 seconds when a vehicle is selected
  useEffect(() => {
    const activeVehicleId = selectedVehicle?.id || vehicles[0]?.id;
    if (!activeVehicleId) return;
    // Initial fetch
    fetchLiveBookings(activeVehicleId);
    const interval = setInterval(() => fetchLiveBookings(activeVehicleId), 20000);
    return () => clearInterval(interval);
  }, [selectedVehicle, vehicles, fetchLiveBookings]);







  // Vehicle Counts
  const availableCount = vehicles.filter(v => v.status === "AVAILABLE").length;
  const onTripCount = vehicles.filter(v => v.status === "ON_TRIP").length;

  const filteredVehicles = vehicles.filter((car) => {
    if (vehicleFilter === "AVAILABLE") return car.status === "AVAILABLE";
    if (vehicleFilter === "ON_TRIP") return car.status === "ON_TRIP";
    return true;
  });

  const activeVehicleForDisplay = selectedVehicle;

  // Active Vehicle Bookings for the selected date — uses live bookings for real-time accuracy
  const activeVehicleBookings = liveBookings.filter((b) => {
    if (!activeVehicleForDisplay || b.vehicleId !== activeVehicleForDisplay.id || b.status === "CANCELLED" || b.status === "COMPLETED") return false;
    // Include any booking that overlaps with the selected date at all
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return bStart < dayEnd && bEnd > dayStart;
  });



  const formatTo12Hour = (dateTimeStr: string) => {
    if (!dateTimeStr) return "HH:MM";
    const parts = dateTimeStr.split("T");
    if (parts.length < 2) return "HH:MM";
    const timePart = parts[1]; // "HH:MM"
    const timeParts = timePart.split(":");
    if (timeParts.length < 2) return "HH:MM";
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    
    if (isNaN(hours)) return "HH:MM";
    
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const slotsList = React.useMemo(() => {
    const now = new Date();
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayMinute = minute === 0 ? "00" : "30";

        const pad = (num: number) => String(num).padStart(2, '0');
        const startStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T${pad(hour)}:${pad(minute)}`;

        let endHour = hour;
        let endMinute = minute + 30;
        if (endMinute === 60) {
          endHour = (hour + 1) % 24;
          endMinute = 0;
        }
        const endStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T${pad(endHour)}:${pad(endMinute)}`;

        const slotStartTime = new Date(startStr);
        const slotEndTime = new Date(endStr);

        // Skip past slots (slot must not have already ended)
        if (slotEndTime <= now) continue;

        slots.push({
          label: `${displayHour}:${displayMinute} ${ampm}`,
          labelFormatted: (
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-bold">{displayHour}:{displayMinute}</span>
              <span className="text-[9px] uppercase mt-1 tracking-wider font-semibold opacity-85">{ampm}</span>
            </div>
          ),
          hour,
          minute,
          startStr,
          endStr,
        });
      }
    }
    return slots;
  }, [selectedDate]);

  const isSlotBooked = (slot: any) => {
    const slotStart = new Date(slot.startStr);
    const slotEnd = new Date(slot.endStr);
    
    return activeVehicleBookings.find((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return (bStart < slotEnd && bEnd > slotStart);
    });
  };

  const handleSlotClick = (slot: any) => {
    setBookingError(null);
    setBookingSuccess(null);

    if (!bookingTimes.startTime || (bookingTimes.startTime && bookingTimes.endTime)) {
      // First click: Set From, clear To
      setBookingTimes({
        ...bookingTimes,
        startTime: slot.startStr,
        endTime: "",
      });
    } else {
      // Second click: Set To
      const startVal = new Date(bookingTimes.startTime).getTime();
      const clickedVal = new Date(slot.startStr).getTime();

      if (clickedVal <= startVal) {
        // If clicked slot is before or equal to start: reset From
        setBookingTimes({
          ...bookingTimes,
          startTime: slot.startStr,
          endTime: "",
        });
      } else {
        // Check for any booked slots in between
        const startValDate = new Date(bookingTimes.startTime);
        const endValDate = new Date(slot.startStr);

        const hasConflictInBetween = liveBookings.some((b) => {
          if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
          if (b.vehicleId !== activeVehicleForDisplay?.id) return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          
          return bStart < endValDate && bEnd > startValDate;
        });

        if (hasConflictInBetween) {
          setBookingError("The selected range overlaps with an existing booking.");
          return;
        }

        // Check for any driver double-bookings in this range
        const hasDriverConflict = bookings.some((b) => {
          if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
          if (b.driverId !== driver.id) return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          
          return bStart < endValDate && bEnd > startValDate;
        });

        if (hasDriverConflict) {
          setBookingError("You already have another booking during this time slot.");
          return;
        }

        // Set To
        setBookingTimes({
          ...bookingTimes,
          endTime: slot.startStr,
        });
      }
    }
    setClickedBookedSlot(null);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!activeVehicleForDisplay) {
      setBookingError("No vehicle selected.");
      return;
    }

    if (!bookingTimes.startTime || !bookingTimes.endTime) {
      setBookingError("Start time and end time are required.");
      return;
    }

    const start = new Date(bookingTimes.startTime);
    const end = new Date(bookingTimes.endTime);

    if (start >= end) {
      setBookingError("End time must be after start time.");
      return;
    }

    // Allow start time to be up to 2 hours in the past to accommodate selecting the current slot
    const graceTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (start < graceTime) {
      setBookingError("Booking start time cannot be in the past.");
      return;
    }

    startTransition(async () => {
      const res = await bookCarAction({
        vehicleId: activeVehicleForDisplay.id,
        driverId: driver.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        pickup: bookingTimes.pickup || "Operations Center",
        destination: bookingTimes.destination || "Destination Site",
        purpose: bookingTimes.purpose,
        assignedBy: "DRIVER",
        requestedBy: driver.name,
      });

      if (res.error) {
        setBookingError(res.error);
      } else {
        setBookingSuccess("Vehicle booked successfully!");
        setBookingTimes({
          startTime: "",
          endTime: "",
          pickup: "",
          destination: "",
          purpose: "Corporate Duty",
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      {/* Welcome banner & Driver details */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-card border border-border p-6 rounded-2xl text-foreground glass glow-primary">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t("btn_driver_portal")}</h2>
          <p className="text-sm text-muted-foreground">{t("manage_assignments")}</p>
        </div>
        <div className="text-xs space-y-2 md:border-l md:border-border/40 md:pl-6">
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground font-semibold">Driver Name:</span> <span className="font-bold text-foreground">{driver.name}</span></div>
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground font-semibold">License ID:</span> <span className="font-mono font-semibold text-foreground">{driver.licenseNumber}</span></div>
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground font-semibold">Expiry Date:</span> <span className="font-semibold text-foreground">{driver.licenseExpiry ? (mounted ? new Date(driver.licenseExpiry).toLocaleDateString() : "") : "N/A"}</span></div>
        </div>
      </div>

      {/* Fleet Vehicles Slot Booking Calendar (Design inspired by reference image) */}
      {/* 1. SELECT VEHICLE SECTION */}
      {!selectedVehicle && (
        <Card className="border-border bg-card text-foreground">
          <CardHeader className="border-b border-border/30 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Select Vehicle
              </CardTitle>
              <CardDescription>Select a vehicle first to view available booking slots.</CardDescription>
            </div>
            {/* Clickable Vehicle Counts */}
            <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-xl border border-border/40 text-xs shrink-0 font-bold">
              <button 
                type="button"
                onClick={() => setVehicleFilter("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  vehicleFilter === "ALL" 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({vehicles.length})
              </button>
              <button 
                type="button"
                onClick={() => setVehicleFilter("AVAILABLE")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  vehicleFilter === "AVAILABLE" 
                    ? "bg-green-600 text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Available ({availableCount})
              </button>
              <button 
                type="button"
                onClick={() => setVehicleFilter("ON_TRIP")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  vehicleFilter === "ON_TRIP" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                On-Trip ({onTripCount})
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {filteredVehicles.map((car) => {
                const isAssigned = assignedVehicle?.id === car.id;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => {
                      setSelectedVehicle(car);
                      setClickedBookedSlot(null);
                    }}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                      isAssigned 
                        ? "border-amber-500 bg-amber-500/10 text-amber-500 font-extrabold shadow-sm"
                        : "border-border bg-card text-foreground hover:bg-muted/10"
                    )}
                  >
                    <Truck className="h-3.5 w-3.5 shrink-0" />
                    {car.name} ({car.vehicleNumber})
                    {isAssigned && <span className="text-[9px] bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded font-bold ml-1 uppercase tracking-wider">Assigned</span>}
                  </button>
                );
              })}
              {filteredVehicles.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No vehicles in this category.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. BOOKING SLOT SECTION */}
      {selectedVehicle && (
        <Card className="border-border bg-card text-foreground">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  Booking Slot
                </CardTitle>
                <CardDescription>
                  Active Vehicle: <span className="font-bold text-primary font-mono">{selectedVehicle.name} ({selectedVehicle.vehicleNumber})</span>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedVehicle(null);
                  setBookingTimes({
                    startTime: "",
                    endTime: "",
                    pickup: "",
                    destination: "",
                    purpose: "Corporate Duty",
                  });
                  setClickedBookedSlot(null);
                }}
                className="font-bold text-xs"
              >
                Change Vehicle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Date Selector Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Date</span>
                <div className="flex items-center gap-2">
                  {/* Live refresh indicator */}
                  {mounted && (
                    <span className="text-[9px] text-muted-foreground">
                      Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {/* Calendar icon — toggles between 7-day strip and full date picker */}
                  <div className="relative">
                    <button
                      type="button"
                      title={showAllDates ? "Back to date strip" : "Browse all dates"}
                      onClick={() => setShowAllDates((v) => !v)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                        showAllDates
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                      )}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {showAllDates ? "Close" : "All Dates"}
                    </button>
                    {showAllDates && (
                      <input
                        type="date"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={mounted ? selectedDate.toISOString().split('T')[0] : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            // parse as local date
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            const picked = new Date(y, m - 1, d);
                            setSelectedDate(picked);
                            setClickedBookedSlot(null);
                            setShowAllDates(false);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
                {windowDates.map((date, idx) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const today = new Date();
                  const isToday = date.toDateString() === today.toDateString();
                  const isPast = date < today && !isToday;
                  const monthStr = date.toLocaleString('default', { month: 'short' });
                  const dayNum = date.getDate();
                  const dayName = date.toLocaleString('default', { weekday: 'short' }).toUpperCase();

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDate(date);
                        setClickedBookedSlot(null);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-between p-2.5 min-w-[66px] h-[80px] rounded-xl border transition-all cursor-pointer shrink-0",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-md glow-primary"
                          : isPast
                          ? "border-border/30 bg-muted/5 text-muted-foreground/40 cursor-not-allowed"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider">{monthStr}</span>
                      <span className="text-lg font-extrabold">{dayNum}</span>
                      <span className={cn("text-[9px] font-semibold", isToday && !isSelected && "text-primary")}>
                        {isToday ? "TODAY" : dayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeVehicleForDisplay && (
              <>

              {/* From & To time fields */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
                {/* From Card */}
                <div className="relative border border-border bg-card rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">From</span>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <Clock className="h-5 w-5 text-muted-foreground/60" />
                    <span className="text-base font-extrabold text-foreground">
                      {mounted && bookingTimes.startTime ? formatTo12Hour(bookingTimes.startTime) : "HH:MM"}
                    </span>
                  </div>
                </div>

                {/* To Card */}
                <div className="relative border border-border bg-card rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">To</span>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <Clock className="h-5 w-5 text-muted-foreground/60" />
                    <span className="text-base font-extrabold text-foreground">
                      {mounted && bookingTimes.endTime ? formatTo12Hour(bookingTimes.endTime) : "HH:MM"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selection Reset Button */}
              {(bookingTimes.startTime || bookingTimes.endTime) && (
                <div className="flex justify-end pt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setBookingTimes({
                        ...bookingTimes,
                        startTime: "",
                        endTime: "",
                      });
                      setClickedBookedSlot(null);
                    }}
                    className="text-[10px] h-7 px-3 font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    Clear Time Selection
                  </Button>
                </div>
              )}

              {/* Time Slots Grid — shows only future slots */}
              <div className="space-y-2 border-t border-border/30 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Time Slot</span>
                  <span className="text-[10px] text-muted-foreground italic">
                    {slotsList.length} slot{slotsList.length !== 1 ? 's' : ''} available
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto pr-1">
                  {slotsList.map((slot, index) => {
                    const booking = isSlotBooked(slot);
                    const isBooked = !!booking;
                    const slotStart = new Date(slot.startStr).getTime();
                    const isSelected = bookingTimes.startTime && bookingTimes.endTime
                      ? (slotStart >= new Date(bookingTimes.startTime).getTime() && slotStart <= new Date(bookingTimes.endTime).getTime())
                      : (bookingTimes.startTime === slot.startStr || bookingTimes.endTime === slot.startStr);
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        title={isBooked ? `Booked by ${(booking as any)?.driver?.name || (booking as any)?.requestedBy || 'Driver'}` : undefined}
                        onClick={() => {
                          if (isBooked) {
                            setClickedBookedSlot(booking);
                          } else {
                            handleSlotClick(slot);
                          }
                        }}
                        className={cn(
                          "p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[60px]",
                          isBooked
                            ? "bg-red-600/80 border-red-700/30 text-white hover:bg-red-600 cursor-help"
                            : isSelected
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-md glow-primary"
                              : "border-border bg-muted/10 hover:bg-muted/30 text-foreground"
                        )}
                      >
                        {slot.labelFormatted}
                        {isBooked && <span className="text-[8px] mt-0.5 opacity-80">Booked</span>}
                      </button>
                    );
                  })}
                </div>

                {clickedBookedSlot && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-foreground space-y-2 mt-3 animate-fade-in">
                    <h4 className="font-bold text-red-500 flex items-center gap-1">🚨 Slot Reservation Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                      <div>
                        <span className="text-muted-foreground block">Booked By</span>
                        <span className="font-semibold text-foreground">{clickedBookedSlot.driver?.name || clickedBookedSlot.requestedBy || "N/A"}</span>
                      </div>
                      {clickedBookedSlot.driver?.employeeId && (
                        <div>
                          <span className="text-muted-foreground block">Employee ID</span>
                          <span className="font-semibold text-foreground">{clickedBookedSlot.driver.employeeId}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground block">Trip Purpose</span>
                        <span className="font-semibold text-foreground">{clickedBookedSlot.purpose || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Booking Schedule</span>
                        <span className="font-semibold text-foreground">
                          {new Date(clickedBookedSlot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(clickedBookedSlot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Time Selection Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 border-t border-border/30 pt-4">
                {bookingError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{bookingError}</p>
                  </div>
                )}
                {bookingSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-xs text-green-500 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <p>{bookingSuccess}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Purpose of Booking</label>
                    <Input
                      type="text"
                      placeholder="e.g. Airport Pickup"
                      value={bookingTimes.purpose}
                      onChange={(e) => setBookingTimes({ ...bookingTimes, purpose: e.target.value })}
                      className="focus-visible:ring-primary text-xs h-10"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary text-white font-bold h-10 shadow-sm hover:glow-primary"
                      disabled={isPending}
                    >
                      {isPending ? "Confirming..." : "Confirm Booking"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
      )}

      {/* My Upcoming Bookings */}
      <Card className="border-border bg-card flex flex-col justify-between w-full text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            {t("my_bookings_schedule")}
          </CardTitle>
          <CardDescription>{t("bookings_schedule_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {bookings
              .filter((b) => b.driverId === driver.id && b.status !== "COMPLETED" && b.status !== "CANCELLED")
              .map((b) => (
                <div key={b.id} className="p-3 bg-muted/30 border border-border/40 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="font-mono text-primary font-bold">{b.tripNumber}</span>
                    <Badge variant="warning">{b.status}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold block">{b.vehicle?.name || "Vehicle"} ({b.vehicle?.vehicleNumber || "—"})</span>
                    <span className="text-muted-foreground block">{b.pickup} ➔ {b.destination}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {mounted ? `📅 ${new Date(b.startTime).toLocaleDateString()} · ${new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
                  </div>
                </div>
              ))}
            {bookings.filter((b) => b.driverId === driver.id && b.status !== "COMPLETED" && b.status !== "CANCELLED").length === 0 && (
              <p className="text-xs text-muted-foreground text-center italic py-6">{t("no_upcoming_bookings")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sunday Upload Reminder Dialog */}
      {showSundayPopup && (
      <Dialog isOpen={showSundayPopup} onClose={() => setShowSundayPopup(false)} title="Weekly Log Screenshot Reminder">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-bold text-foreground">Weekly Screenshot Due Today!</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Today is Sunday. Please remember to capture your weekly work statement and upload the screenshot inside the Weekly Log portal.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button variant="outline" onClick={() => setShowSundayPopup(false)}>
              Remind Me Later
            </Button>
            <Button 
              onClick={() => {
                setShowSundayPopup(false);
                router.push("/driver/weekly-log");
              }} 
              className="bg-primary text-white font-semibold"
            >
              Upload Log Now
            </Button>
          </div>
        </div>
      </Dialog>
      )}
    </div>
  );
}
