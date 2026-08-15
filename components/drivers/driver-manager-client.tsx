"use client";

import React, { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { User, Vehicle, Trip } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { bookCarAction } from "@/actions/driver-trips";
import { assignVehicleToDriver } from "@/actions/vehicles";
import { Search, Plus, Clock, MapPin, CheckCircle2, ChevronRight, UserCheck } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

interface DriverManagerProps {
  drivers: (User & { assignedVehicle?: Vehicle[] })[];
  bookings: (Trip & { driver?: User | null; vehicle?: Vehicle | null })[];
  vehicles: Vehicle[];
  currentUserName: string;
}

export function DriverManagerClient({ drivers, bookings, vehicles, currentUserName }: DriverManagerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<(User & { assignedVehicle?: Vehicle[] }) | null>((drivers[0] as any) || null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Live active bookings for selected vehicle (to show in the slots calendar)
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [clickedBookedSlot, setClickedBookedSlot] = useState<any>(null);

  const [bookingForm, setBookingForm] = useState({
    vehicleId: "",
    startTime: "",
    endTime: "",
    pickup: "",
    destination: "",
    purpose: "Corporate Duty",
    notes: "",
  });

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDriver = selectedDriver || drivers[0] || null;

  // Filter bookings for selected driver
  const driverBookings = activeDriver
    ? bookings.filter((b) => b.driverId === activeDriver.id)
    : [];

  const now = new Date();

  // Categorize selected driver bookings
  const upcomingBookings = driverBookings.filter(
    (b) => new Date(b.endTime) > now && b.status !== "CANCELLED" && b.status !== "COMPLETED"
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastBookings = driverBookings.filter(
    (b) => new Date(b.endTime) <= now || b.status === "CANCELLED" || b.status === "COMPLETED"
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Date strip window dates
  const [windowDates, setWindowDates] = useState<Date[]>([]);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    setWindowDates(list);
  }, [selectedDate]);

  // Helper: fetch live bookings for active vehicle
  const fetchLiveBookings = useCallback(async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/bookings?vehicleId=${vehicleId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.bookings) {
        setLiveBookings(data.bookings);
      }
    } catch {
      // silently ignore network errors
    }
  }, []);

  // Poll for live bookings when vehicle is selected in form
  useEffect(() => {
    if (!bookingForm.vehicleId || !isBookingOpen) return;
    fetchLiveBookings(bookingForm.vehicleId);
    const interval = setInterval(() => fetchLiveBookings(bookingForm.vehicleId), 20000);
    return () => clearInterval(interval);
  }, [bookingForm.vehicleId, isBookingOpen, fetchLiveBookings]);

  // Time format helper
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

  // Generate 48 half-hour slots for the selectedDate
  const slotsList = useMemo(() => {
    const slots = [];
    const nowTime = new Date();
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

        // Skip past slots
        if (slotEndTime <= nowTime) continue;

        slots.push({
          label: `${displayHour}:${displayMinute} ${ampm}`,
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
    
    return liveBookings.find((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return (bStart < slotEnd && bEnd > slotStart);
    });
  };

  const handleSlotClick = (slot: any) => {
    setFormError(null);
    setFormSuccess(false);

    if (!bookingForm.startTime || (bookingForm.startTime && bookingForm.endTime)) {
      // First click: Set From, clear To
      setBookingForm({
        ...bookingForm,
        startTime: slot.startStr,
        endTime: "",
      });
    } else {
      // Second click: Set To
      const startVal = new Date(bookingForm.startTime).getTime();
      const clickedVal = new Date(slot.startStr).getTime();

      if (clickedVal <= startVal) {
        setBookingForm({
          ...bookingForm,
          startTime: slot.startStr,
          endTime: "",
        });
      } else {
        // Check for any booked slots in between
        const startValDate = new Date(bookingForm.startTime);
        const endValDate = new Date(slot.startStr);

        const hasConflictInBetween = liveBookings.some((b) => {
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          return bStart < endValDate && bEnd > startValDate;
        });

        if (hasConflictInBetween) {
          setFormError("The selected range overlaps with an existing booking.");
          return;
        }

        // Check for any driver double-bookings in this range
        const hasDriverConflict = bookings.some((b) => {
          if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
          if (b.driverId !== activeDriver?.id) return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          
          return bStart < endValDate && bEnd > startValDate;
        });

        if (hasDriverConflict) {
          setFormError("The selected driver already has another booking during this time slot.");
          return;
        }

        setBookingForm({
          ...bookingForm,
          endTime: slot.startStr,
        });
      }
    }
    setClickedBookedSlot(null);
  };

  const handleOpenBooking = () => {
    setBookingForm({
      vehicleId: vehicles[0]?.id || "",
      startTime: "",
      endTime: "",
      pickup: "",
      destination: "",
      purpose: "Corporate Duty",
      notes: "",
    });
    setFormError(null);
    setFormSuccess(false);
    setSelectedDate(new Date());
    setLiveBookings([]);
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeDriver) return;
    if (!bookingForm.vehicleId) {
      setFormError("Please select a vehicle.");
      return;
    }

    if (!bookingForm.startTime || !bookingForm.endTime) {
      setFormError("Start time and end time are required.");
      return;
    }

    const start = new Date(bookingForm.startTime);
    const end = new Date(bookingForm.endTime);

    if (start >= end) {
      setFormError("End time must be after start time.");
      return;
    }

    // Allow start time to be up to 2 hours in the past
    const graceTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (start < graceTime) {
      setFormError("Booking start time cannot be in the past.");
      return;
    }

    startTransition(async () => {
      const res = await bookCarAction({
        vehicleId: bookingForm.vehicleId,
        driverId: activeDriver.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        pickup: bookingForm.pickup,
        destination: bookingForm.destination,
        purpose: bookingForm.purpose,
        notes: bookingForm.notes || undefined,
        assignedBy: "ADMIN",
        requestedBy: `ADMIN (${currentUserName})`,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(true);
        setTimeout(() => {
          setIsBookingOpen(false);
          router.refresh();
        }, 1500);
      }
    });
  };

  const currentAssignedCar = activeDriver?.assignedVehicle?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Driver Management & Booking</h2>
        <p className="text-sm text-muted-foreground">
          View registered drivers, search booking schedules, and reserve vehicle slots on their behalf.
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Drivers List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              placeholder="Search driver by name or ID..."
              className="pl-10 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border">
            <div className="p-3 bg-muted/20 font-bold text-xs uppercase text-muted-foreground tracking-wider flex justify-between items-center">
              <span>Drivers ({filteredDrivers.length})</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] bg-primary/15 hover:bg-primary/25 text-primary hover:text-primary font-bold px-2 py-0.5 rounded-lg cursor-pointer"
                onClick={() => router.push("/register")}
              >
                + Register Driver
              </Button>
            </div>
            <div className="max-h-[550px] overflow-y-auto divide-y divide-border/60">
              {filteredDrivers.map((driver) => {
                const isSelected = activeDriver?.id === driver.id;
                return (
                  <button
                    key={driver.id}
                    onClick={() => {
                      setSelectedDriver(driver);
                      setFormError(null);
                    }}
                    className={`w-full text-left p-4 transition-all duration-150 flex items-center justify-between border-none ${
                      isSelected
                        ? "bg-primary/10 text-primary border-l-4 border-l-primary font-semibold"
                        : "hover:bg-muted/30 text-foreground"
                    }`}
                  >
                    <div>
                      <span className="block text-sm">{driver.name}</span>
                      <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{driver.employeeId}</span>
                    </div>
                    <ChevronRight className={`h-4.5 w-4.5 transition-transform ${isSelected ? 'translate-x-1 text-primary' : 'text-muted-foreground'}`} />
                  </button>
                );
              })}
              {filteredDrivers.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  No drivers found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Driver Details & Bookings (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeDriver ? (
            <div className="space-y-6">
              {/* Driver Summary Banner */}
              <div className="p-6 border border-border bg-card rounded-xl space-y-4 glass">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Selected Driver</span>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <UserCheck className="h-5.5 w-5.5 text-primary" /> {activeDriver.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{activeDriver.employeeId} &bull; {activeDriver.email}</p>
                  </div>
                  <Button onClick={handleOpenBooking} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shrink-0">
                    <Plus className="h-4.5 w-4.5 mr-2" /> Book Slot on Behalf
                  </Button>
                </div>

                {/* Permanent Vehicle Allocation Section */}
                <div className="border-t border-border/30 pt-4 mt-2 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Permanent Vehicle Allocation</span>
                  {currentAssignedCar ? (
                    <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <div>
                        <span className="text-xs text-foreground font-bold">{currentAssignedCar.name}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono ml-2">({currentAssignedCar.vehicleNumber})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          startTransition(async () => {
                            const res = await assignVehicleToDriver(currentAssignedCar.id, null);
                            if (res.error) {
                              alert(res.error);
                            } else {
                              router.refresh();
                            }
                          });
                        }}
                        className="h-8 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
                        disabled={isPending}
                      >
                        Unallocate Car
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        id="assign-vehicle-select"
                        className="flex h-9 w-full sm:w-64 rounded-lg border border-border bg-input px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Allocate Vehicle --</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.vehicleNumber})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={async () => {
                          const selectEl = document.getElementById("assign-vehicle-select") as HTMLSelectElement;
                          const vehicleId = selectEl?.value;
                          if (!vehicleId) return;
                          startTransition(async () => {
                            const res = await assignVehicleToDriver(vehicleId, activeDriver.id);
                            if (res.error) {
                              alert(res.error);
                            } else {
                              router.refresh();
                            }
                          });
                        }}
                        className="bg-primary text-white font-semibold h-9 text-xs cursor-pointer"
                        disabled={isPending}
                      >
                        Allocate Vehicle
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Slots */}
              <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 bg-muted/20 border-b border-border font-bold text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Upcoming & Active Bookings ({upcomingBookings.length})
                </div>
                <div className="p-4 space-y-3">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="p-4 border border-border/60 rounded-xl bg-muted/10 glass space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm text-foreground">{b.vehicle?.name}</span>
                          <span className="text-xs text-muted-foreground block font-mono">{b.vehicle?.vehicleNumber}</span>
                        </div>
                        <Badge variant="info" className="uppercase text-[9px]">{b.status}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-border/30 pt-2.5 mt-2.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(b.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} - {new Date(b.endTime).toLocaleTimeString([], { timeStyle: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{b.pickup} &rarr; {b.destination}</span>
                        </div>
                      </div>
                      {b.notes && (
                        <div className="bg-card/50 p-2 rounded border border-border/30 text-[11px] text-muted-foreground italic">
                          Notes: {b.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground italic">
                      No upcoming bookings scheduled for this driver.
                    </div>
                  )}
                </div>
              </div>

              {/* Past Bookings */}
              <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 bg-muted/20 border-b border-border font-bold text-sm text-foreground">
                  Past Booking History ({pastBookings.length})
                </div>
                <div className="p-4 space-y-3">
                  {pastBookings.map((b) => (
                    <div key={b.id} className="p-4 border border-border/40 rounded-xl bg-muted/5 space-y-2 opacity-85">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-sm text-foreground">{b.vehicle?.name}</span>
                          <span className="text-xs text-muted-foreground block font-mono">{b.vehicle?.vehicleNumber}</span>
                        </div>
                        <Badge variant="secondary" className="uppercase text-[9px]">{b.status}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-border/20 pt-2 mt-2">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(b.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} - {new Date(b.endTime).toLocaleTimeString([], { timeStyle: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{b.pickup} &rarr; {b.destination}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pastBookings.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground italic">
                      No historical bookings logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
              Please select a driver from the list to view their schedule.
            </div>
          )}
        </div>
      </div>

      {/* Book Slot on Behalf Modal */}
      {activeDriver && (
        <Dialog isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} title={`Book Slot on Behalf of ${activeDriver.name}`}>
          <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
            {formError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5" /> Booking Created Successfully!
              </div>
            )}

            {/* Select Vehicle dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground block">Select Vehicle</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                value={bookingForm.vehicleId}
                onChange={(e) => {
                  setBookingForm({ ...bookingForm, vehicleId: e.target.value, startTime: "", endTime: "" });
                  setClickedBookedSlot(null);
                }}
                required
              >
                <option value="" disabled>-- Select Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vehicleNumber}) &bull; {v.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time slots selection */}
            {bookingForm.vehicleId && (
              <>
                <div className="space-y-2 border-t border-border/30 pt-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Select Date</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
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
                            "flex flex-col items-center justify-between p-2 min-w-[55px] h-[70px] rounded-xl border transition-all cursor-pointer shrink-0 text-xs",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                              : isPast
                              ? "border-border/30 bg-muted/5 text-muted-foreground/40 cursor-not-allowed"
                              : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                          )}
                        >
                          <span className="text-[8px] uppercase font-bold tracking-wider">{monthStr}</span>
                          <span className="text-base font-extrabold">{dayNum}</span>
                          <span className="text-[8px] font-semibold">{isToday ? "TODAY" : dayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* From & To Preview */}
                <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
                  <div className="relative border border-border bg-card rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">From</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground/60" />
                      <span className="text-sm font-extrabold text-foreground">
                        {bookingForm.startTime ? formatTo12Hour(bookingForm.startTime) : "HH:MM"}
                      </span>
                    </div>
                  </div>
                  <div className="relative border border-border bg-card rounded-xl p-3 flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">To</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground/60" />
                      <span className="text-sm font-extrabold text-foreground">
                        {bookingForm.endTime ? formatTo12Hour(bookingForm.endTime) : "HH:MM"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clear time selection */}
                {(bookingForm.startTime || bookingForm.endTime) && (
                  <div className="flex justify-end pt-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setBookingForm({
                          ...bookingForm,
                          startTime: "",
                          endTime: "",
                        });
                        setClickedBookedSlot(null);
                      }}
                      className="text-[9px] h-6 px-2 font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Clear Time Selection
                    </Button>
                  </div>
                )}

                {/* Time Slots Grid */}
                <div className="space-y-2 border-t border-border/30 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Time Slot</span>
                    <span className="text-[9px] text-muted-foreground italic">
                      {slotsList.length} slots available
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {slotsList.map((slot, index) => {
                      const booking = isSlotBooked(slot);
                      const isBooked = !!booking;
                      const slotStart = new Date(slot.startStr).getTime();
                      const isSelected = bookingForm.startTime && bookingForm.endTime
                        ? (slotStart >= new Date(bookingForm.startTime).getTime() && slotStart <= new Date(bookingForm.endTime).getTime())
                        : (bookingForm.startTime === slot.startStr || bookingForm.endTime === slot.startStr);

                      return (
                        <button
                          key={index}
                          type="button"
                          title={isBooked ? `Booked by ${booking.driver?.name || booking.requestedBy || 'Driver'}` : undefined}
                          onClick={() => {
                            if (isBooked) {
                              setClickedBookedSlot(booking);
                            } else {
                              handleSlotClick(slot);
                            }
                          }}
                          className={cn(
                            "p-1.5 rounded-lg border flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[45px] text-[10px]",
                            isBooked
                              ? "bg-red-600/80 border-red-700/30 text-white hover:bg-red-600"
                              : isSelected
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-border bg-muted/10 hover:bg-muted/30 text-foreground"
                          )}
                        >
                          {slot.label}
                          {isBooked && <span className="text-[7px] mt-0.5 opacity-80">Booked</span>}
                        </button>
                      );
                    })}
                  </div>

                  {clickedBookedSlot && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-[11px] text-foreground space-y-1 mt-2">
                      <h4 className="font-bold text-red-500 flex items-center gap-1">🚨 Slot Reservation Details</h4>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="text-muted-foreground block text-[9px]">Booked By</span>
                          <span className="font-semibold">{clickedBookedSlot.driver?.name || clickedBookedSlot.requestedBy || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[9px]">Schedule</span>
                          <span className="font-semibold">
                            {new Date(clickedBookedSlot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(clickedBookedSlot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <form onSubmit={handleBookingSubmit} className="space-y-4 border-t border-border/30 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Pickup Location</label>
                      <Input
                        placeholder="Base Depot / Airport"
                        value={bookingForm.pickup}
                        onChange={(e) => setBookingForm({ ...bookingForm, pickup: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Destination Location</label>
                      <Input
                        placeholder="Hotel / Corporate Office"
                        value={bookingForm.destination}
                        onChange={(e) => setBookingForm({ ...bookingForm, destination: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Purpose</label>
                    <Input
                      placeholder="Corporate Duty"
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Notes (Optional)</label>
                    <textarea
                      className="flex min-h-[50px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Add notes for the trip..."
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold">
                      {isPending ? "Booking..." : "Confirm Booking"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
