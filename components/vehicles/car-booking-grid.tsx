"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Vehicle, User, Trip } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bookCarAction } from "@/actions/driver-trips";
import { Calendar, Clock, User as UserIcon, MapPin, Check, AlertCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/components/layout/language-provider";

// Extend Trip to include relations if present
type TripWithRelations = Trip & {
  driver?: User | null;
  vehicle?: Vehicle | null;
};

interface CarBookingGridProps {
  vehicle: Vehicle;
  bookings: TripWithRelations[];
  drivers: User[];
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  isImmediate?: boolean;
  onClose: () => void;
}

export function CarBookingGrid({
  vehicle,
  bookings,
  drivers,
  currentUserId,
  currentUserRole,
  currentUserName,
  isImmediate = false,
  onClose,
}: CarBookingGridProps) {
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Slot dates
  const [todayDate, setTodayDate] = useState<Date>(new Date());
  const [tomorrowDate, setTomorrowDate] = useState<Date>(new Date());

  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    start: Date;
    end: Date;
    label: string;
  } | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"today_tomorrow" | "monthly" | "yearly">("today_tomorrow");
  const [monthlyYear, setMonthlyYear] = useState<number>(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(new Date().getMonth());
  const [yearlyYear, setYearlyYear] = useState<number>(new Date().getFullYear());
  const [manualStartTime, setManualStartTime] = useState<string>("");
  const [manualEndTime, setManualEndTime] = useState<string>("");

  const formatToLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setTodayDate(today);
    setTomorrowDate(tomorrow);
    setSelectedDate(today);
    setMonthlyYear(today.getFullYear());
    setMonthlyMonth(today.getMonth());
    setYearlyYear(today.getFullYear());

    if (isImmediate) {
      const now = new Date();
      const startHour = Math.floor(now.getHours() / 2) * 2;
      const endHour = startHour + 2;

      const start = new Date(today);
      start.setHours(startHour, 0, 0, 0);

      const end = new Date(today);
      end.setHours(endHour, 0, 0, 0);

      setSelectedSlot({
        date: today,
        start,
        end,
        label: `${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`,
      });
      setManualStartTime(formatToLocalDateTime(start));
      setManualEndTime(formatToLocalDateTime(end));
    }
  }, [isImmediate]);

  const hasBookingsOnDate = (date: Date) => {
    return bookings.some((b) => {
      if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return bStart < dayEnd && bEnd > dayStart;
    });
  };

  const getDaysForMonthGrid = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday

    const grid = [];
    
    // Empty padding slots
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    
    // Actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(new Date(year, month, i));
    }
    
    return grid;
  };

  const handlePrevMonth = () => {
    if (monthlyMonth === 0) {
      setMonthlyMonth(11);
      setMonthlyYear((prev) => prev - 1);
    } else {
      setMonthlyMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthlyMonth === 11) {
      setMonthlyMonth(0);
      setMonthlyYear((prev) => prev + 1);
    } else {
      setMonthlyMonth((prev) => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setYearlyYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setYearlyYear((prev) => prev + 1);
  };

  const handleYearlyDayClick = (date: Date) => {
    setMonthlyYear(date.getFullYear());
    setMonthlyMonth(date.getMonth());
    setSelectedDate(date);
    setViewMode("monthly");
  };

  const getLocale = () => {
    return language === "fi" ? "fi-FI" : "en-US";
  };

  const weekdays = language === "fi"
    ? ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthNames = language === "fi"
    ? ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kes├ñkuu", "Hein├ñkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [bookingDetails, setBookingDetails] = useState({
    pickup: "",
    destination: "",
    purpose: "Corporate Duty",
    notes: "",
    driverId: currentUserRole === "DRIVER" ? currentUserId : drivers[0]?.id || "",
  });

  // Generate 12 two-hour slots (00:00 to 24:00) for a given date
  const getSlotsForDate = (date: Date) => {
    return Array.from({ length: 12 }, (_, i) => {
      const startHour = i * 2;
      const endHour = startHour + 2;

      const start = new Date(date);
      start.setHours(startHour, 0, 0, 0);

      const end = new Date(date);
      end.setHours(endHour, 0, 0, 0);

      const label = `${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;

      return { start, end, label };
    });
  };

  const getSlotBookingInfo = (start: Date, end: Date) => {
    return bookings.find((b) => {
      if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < end && bEnd > start;
    });
  };

  const isSlotPast = (end: Date) => {
    return end.getTime() < Date.now();
  };

  const handleSlotClick = (slot: { date: Date; start: Date; end: Date; label: string }, bookingInfo?: TripWithRelations) => {
    if (bookingInfo) {
      // Slot is booked, do not select
      return;
    }
    if (isSlotPast(slot.end)) {
      // Slot in the past, do not select
      return;
    }

    setSelectedSlot(slot);
    setManualStartTime(formatToLocalDateTime(slot.start));
    setManualEndTime(formatToLocalDateTime(slot.end));
    setFormSuccess(false);
    setFormError(null);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedSlot) return;
    if (!manualStartTime || !manualEndTime) {
      setFormError("Please select both start time and end time.");
      return;
    }

    const start = new Date(manualStartTime);
    const end = new Date(manualEndTime);

    if (start >= end) {
      setFormError("End time must be after start time.");
      return;
    }

    if (end.getTime() < Date.now()) {
      setFormError("Cannot book a time slot in the past.");
      return;
    }

    if (!bookingDetails.pickup || !bookingDetails.destination) {
      setFormError("Please fill out pickup and destination locations.");
      return;
    }
    if (!bookingDetails.driverId) {
      setFormError("Please select a driver for this booking.");
      return;
    }

    const driverName = currentUserRole === "DRIVER" 
      ? currentUserName 
      : drivers.find(d => d.id === bookingDetails.driverId)?.name || "Admin Assignment";

    startTransition(async () => {
      const res = await bookCarAction({
        vehicleId: vehicle.id,
        driverId: bookingDetails.driverId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        pickup: bookingDetails.pickup,
        destination: bookingDetails.destination,
        purpose: bookingDetails.purpose,
        notes: bookingDetails.notes || undefined,
        assignedBy: currentUserRole === "DRIVER" ? "DRIVER" : "ADMIN",
        requestedBy: currentUserRole === "DRIVER" ? currentUserName : `ADMIN (${currentUserName})`,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(true);
        setSelectedSlot(null);
        setBookingDetails({
          ...bookingDetails,
          pickup: "",
          destination: "",
          notes: "",
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    });
  };

  if (!mounted) return null;

  const todaySlots = getSlotsForDate(todayDate);
  const tomorrowSlots = getSlotsForDate(tomorrowDate);

  // Sort historical bookings to display history
  const historicalBookings = [...bookings]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="space-y-6 text-foreground">
      {/* Vehicle Info Summary Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
        <div>
          <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t("selected_vehicle")}</span>
          <h4 className="text-lg font-bold text-foreground">{vehicle.name}</h4>
          <span className="font-mono text-xs font-bold text-primary block mt-0.5">{vehicle.vehicleNumber} ┬╖ {vehicle.carType || "Sedan"}</span>
        </div>
        <div className="text-right text-xs">
          <span className="text-muted-foreground">{t("odometer")}: </span>
          <span className="font-bold font-mono">{vehicle.odometer.toLocaleString()} km</span>
          <span className="block mt-1">
            {t("status")}: <Badge variant={vehicle.status === "AVAILABLE" ? "success" : "info"}>
              {vehicle.status === "AVAILABLE" ? t("available") : t("on_trip")}
            </Badge>
          </span>
        </div>
      </div>

      {/* Booking Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground font-semibold">{t("legend")}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-green-600 border border-green-500 block"></span>
          <span>{t("available")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-red-500/80 border border-red-500 block"></span>
          <span>{t("booked")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-muted-foreground/20 border border-border block"></span>
          <span>{t("past_elapsed")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-primary block border border-primary-foreground/30 animate-pulse"></span>
          <span>{t("selected")}</span>
        </div>
      </div>

      {/* View Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-4">
        <Button
          type="button"
          variant={viewMode === "today_tomorrow" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("today_tomorrow")}
          className={cn(
            "rounded-lg transition-all font-semibold cursor-pointer",
            viewMode === "today_tomorrow" ? "bg-primary text-white" : "hover:bg-muted/50"
          )}
        >
          {t("today_tomorrow_view")}
        </Button>
        <Button
          type="button"
          variant={viewMode === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("monthly")}
          className={cn(
            "rounded-lg transition-all font-semibold cursor-pointer",
            viewMode === "monthly" ? "bg-primary text-white" : "hover:bg-muted/50"
          )}
        >
          {t("monthly_view")}
        </Button>
        <Button
          type="button"
          variant={viewMode === "yearly" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("yearly")}
          className={cn(
            "rounded-lg transition-all font-semibold cursor-pointer",
            viewMode === "yearly" ? "bg-primary text-white" : "hover:bg-muted/50"
          )}
        >
          {t("yearly_view")}
        </Button>
      </div>

      {viewMode === "today_tomorrow" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's slots */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 border-b border-border/40 pb-2">
              <Calendar className="h-4.5 w-4.5 text-primary" />
              {t("todays_slots")} ({todayDate.toLocaleDateString(getLocale(), { month: "short", day: "numeric" })})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {todaySlots.map((slot, idx) => {
                const bookingInfo = getSlotBookingInfo(slot.start, slot.end);
                const past = isSlotPast(slot.end);
                const isSelected = selectedSlot && selectedSlot.start.getTime() === slot.start.getTime() && selectedSlot.end.getTime() === slot.end.getTime();

                let slotBg = "bg-green-600 hover:bg-green-700 text-white border-green-500";
                let titleText = "Available for booking";
                
                if (past) {
                  slotBg = "bg-muted-foreground/10 text-muted-foreground cursor-not-allowed border-border/30";
                  titleText = "This slot is in the past";
                } else if (bookingInfo) {
                  slotBg = "bg-red-500/80 hover:bg-red-500 text-white border-red-500 cursor-help";
                  titleText = `${t("booked_by")}: ${bookingInfo.driver?.name || bookingInfo.requestedBy || "Operations"} ${bookingInfo.driver?.employeeId ? `(ID: ${bookingInfo.driver.employeeId})` : ""} - Purpose: ${bookingInfo.purpose}`;
                } else if (isSelected) {
                  slotBg = "bg-primary hover:bg-primary/95 text-white border-primary-foreground/20 ring-2 ring-primary/45";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    title={titleText}
                    disabled={past || !!bookingInfo}
                    onClick={() => handleSlotClick({ ...slot, date: todayDate })}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold font-mono transition-all min-h-[76px]",
                      slotBg,
                      !past && !bookingInfo && "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <span>{slot.label}</span>
                    {bookingInfo && (
                      <div className="text-[10px] opacity-95 truncate max-w-full font-sans mt-1 flex flex-col items-center gap-0.5 w-full px-1">
                        <span className="font-bold flex items-center gap-0.5 justify-center">
                          <UserIcon className="h-2.5 w-2.5 shrink-0" />
                          {bookingInfo.driver?.name || bookingInfo.requestedBy || "Booked"}
                        </span>
                        {bookingInfo.driver?.employeeId && (
                          <span className="text-[8px] opacity-80 font-mono">
                            ID: {bookingInfo.driver.employeeId}
                          </span>
                        )}
                        <span className="text-[8px] opacity-80 italic truncate max-w-full">
                          {bookingInfo.purpose}
                        </span>
                      </div>
                    )}
                    {past && (
                      <span className="text-[8px] opacity-75 font-sans mt-1">{t("expired")}</span>
                    )}
                    {!past && !bookingInfo && !isSelected && (
                      <span className="text-[9px] text-green-200 font-sans mt-1">{t("available")}</span>
                    )}
                    {isSelected && (
                      <span className="text-[9px] text-primary-foreground font-semibold font-sans mt-1 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> {t("selected")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tomorrow's slots */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2 border-b border-border/40 pb-2">
              <Calendar className="h-4.5 w-4.5 text-primary" />
              {t("tomorrows_slots")} ({tomorrowDate.toLocaleDateString(getLocale(), { month: "short", day: "numeric" })})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {tomorrowSlots.map((slot, idx) => {
                const bookingInfo = getSlotBookingInfo(slot.start, slot.end);
                const past = isSlotPast(slot.end);
                const isSelected = selectedSlot && selectedSlot.start.getTime() === slot.start.getTime() && selectedSlot.end.getTime() === slot.end.getTime();

                let slotBg = "bg-green-600 hover:bg-green-700 text-white border-green-500";
                let titleText = "Available for booking";
                
                if (past) {
                  slotBg = "bg-muted-foreground/10 text-muted-foreground cursor-not-allowed border-border/30";
                  titleText = "This slot is in the past";
                } else if (bookingInfo) {
                  slotBg = "bg-red-500/80 hover:bg-red-500 text-white border-red-500 cursor-help";
                  titleText = `${t("booked_by")}: ${bookingInfo.driver?.name || bookingInfo.requestedBy || "Operations"} ${bookingInfo.driver?.employeeId ? `(ID: ${bookingInfo.driver.employeeId})` : ""} - Purpose: ${bookingInfo.purpose}`;
                } else if (isSelected) {
                  slotBg = "bg-primary hover:bg-primary/95 text-white border-primary-foreground/20 ring-2 ring-primary/45";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    title={titleText}
                    disabled={past || !!bookingInfo}
                    onClick={() => handleSlotClick({ ...slot, date: tomorrowDate })}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold font-mono transition-all min-h-[76px]",
                      slotBg,
                      !past && !bookingInfo && "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    )}
                  >
                    <span>{slot.label}</span>
                    {bookingInfo && (
                      <div className="text-[10px] opacity-95 truncate max-w-full font-sans mt-1 flex flex-col items-center gap-0.5 w-full px-1">
                        <span className="font-bold flex items-center gap-0.5 justify-center">
                          <UserIcon className="h-2.5 w-2.5 shrink-0" />
                          {bookingInfo.driver?.name || bookingInfo.requestedBy || "Booked"}
                        </span>
                        {bookingInfo.driver?.employeeId && (
                          <span className="text-[8px] opacity-80 font-mono">
                            ID: {bookingInfo.driver.employeeId}
                          </span>
                        )}
                        <span className="text-[8px] opacity-80 italic truncate max-w-full">
                          {bookingInfo.purpose}
                        </span>
                      </div>
                    )}
                    {past && (
                      <span className="text-[8px] opacity-75 font-sans mt-1">{t("expired")}</span>
                    )}
                    {!past && !bookingInfo && !isSelected && (
                      <span className="text-[9px] text-green-200 font-sans mt-1">{t("available")}</span>
                    )}
                    {isSelected && (
                      <span className="text-[9px] text-primary-foreground font-semibold font-sans mt-1 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> {t("selected")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === "monthly" && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Card */}
            <Card className="p-4 border border-border/40 bg-muted/10 w-full lg:max-w-md shrink-0">
              {/* Header with Nav */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-base text-foreground capitalize">
                  {monthNames[monthlyMonth]} {monthlyYear}
                </h4>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Weekday Grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground mb-2">
                {weekdays.map((w, idx) => (
                  <div key={idx} className="py-1">
                    {w}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {getDaysForMonthGrid(monthlyYear, monthlyMonth).map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="p-2" />;
                  }

                  const isToday =
                    day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear();

                  const isSelected =
                    day.getDate() === selectedDate.getDate() &&
                    day.getMonth() === selectedDate.getMonth() &&
                    day.getFullYear() === selectedDate.getFullYear();

                  const hasBookings = hasBookingsOnDate(day);

                  return (
                    <button
                      key={`day-${idx}`}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative h-10 w-full rounded-lg flex flex-col items-center justify-center font-medium transition-all hover:bg-muted/80 cursor-pointer",
                        isSelected
                          ? "bg-primary text-white hover:bg-primary/90 font-bold"
                          : isToday
                          ? "border border-primary text-primary"
                          : "text-foreground"
                      )}
                    >
                      <span>{day.getDate()}</span>
                      {hasBookings && (
                        <span
                          className={cn(
                            "absolute bottom-1.5 w-1.5 h-1.5 rounded-full",
                            isSelected ? "bg-white" : "bg-red-500"
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Time slots for selected date */}
            <div className="flex-1 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2 border-b border-border/40 pb-2">
                <Clock className="h-4.5 w-4.5 text-primary" />
                {t("slots_for_date")}: {selectedDate.toLocaleDateString(getLocale(), { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {getSlotsForDate(selectedDate).map((slot, idx) => {
                  const bookingInfo = getSlotBookingInfo(slot.start, slot.end);
                  const past = isSlotPast(slot.end);
                  const isSelected = selectedSlot && selectedSlot.start.getTime() === slot.start.getTime() && selectedSlot.end.getTime() === slot.end.getTime();

                  let slotBg = "bg-green-600 hover:bg-green-700 text-white border-green-500";
                  let titleText = "Available for booking";
                  
                  if (past) {
                    slotBg = "bg-muted-foreground/10 text-muted-foreground cursor-not-allowed border-border/30";
                    titleText = "This slot is in the past";
                  } else if (bookingInfo) {
                    slotBg = "bg-red-500/80 hover:bg-red-500 text-white border-red-500 cursor-help";
                    titleText = `${t("booked_by")}: ${bookingInfo.driver?.name || bookingInfo.requestedBy || "Operations"} ${bookingInfo.driver?.employeeId ? `(ID: ${bookingInfo.driver.employeeId})` : ""} - Purpose: ${bookingInfo.purpose}`;
                  } else if (isSelected) {
                    slotBg = "bg-primary hover:bg-primary/95 text-white border-primary-foreground/20 ring-2 ring-primary/45";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      title={titleText}
                      disabled={past || !!bookingInfo}
                      onClick={() => handleSlotClick({ ...slot, date: selectedDate })}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold font-mono transition-all min-h-[76px]",
                        slotBg,
                        !past && !bookingInfo && "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      )}
                    >
                      <span>{slot.label}</span>
                      {bookingInfo && (
                        <div className="text-[10px] opacity-95 truncate max-w-full font-sans mt-1 flex flex-col items-center gap-0.5 w-full px-1">
                          <span className="font-bold flex items-center gap-0.5 justify-center">
                            <UserIcon className="h-2.5 w-2.5 shrink-0" />
                            {bookingInfo.driver?.name || bookingInfo.requestedBy || "Booked"}
                          </span>
                          {bookingInfo.driver?.employeeId && (
                            <span className="text-[8px] opacity-80 font-mono">
                              ID: {bookingInfo.driver.employeeId}
                            </span>
                          )}
                          <span className="text-[8px] opacity-80 italic truncate max-w-full">
                            {bookingInfo.purpose}
                          </span>
                        </div>
                      )}
                      {past && (
                        <span className="text-[8px] opacity-75 font-sans mt-1">{t("expired")}</span>
                      )}
                      {!past && !bookingInfo && !isSelected && (
                        <span className="text-[9px] text-green-200 font-sans mt-1">{t("available")}</span>
                      )}
                      {isSelected && (
                        <span className="text-[9px] text-primary-foreground font-semibold font-sans mt-1 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> {t("selected")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "yearly" && (
        <div className="space-y-6">
          {/* Year Nav Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t("yearly_view")}: {yearlyYear}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={handlePrevYear}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={handleNextYear}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {monthNames.map((monthName, monthIdx) => {
              const days = getDaysForMonthGrid(yearlyYear, monthIdx);
              
              return (
                <Card key={monthIdx} className="p-3 border border-border/40 bg-muted/5 hover:border-primary/20 transition-all flex flex-col">
                  <span className="block text-center font-bold text-xs uppercase text-primary tracking-wide mb-2">
                    {monthName}
                  </span>
                  
                  {/* Weekday Initials */}
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-bold text-muted-foreground mb-1">
                    {weekdays.map((w, idx) => (
                      <div key={idx}>{w[0]}</div>
                    ))}
                  </div>

                  {/* Month Days Grid */}
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] flex-1">
                    {days.map((day, dayIdx) => {
                      if (!day) {
                        return <div key={`empty-${monthIdx}-${dayIdx}`} />;
                      }

                      const isToday =
                        day.getDate() === new Date().getDate() &&
                        day.getMonth() === new Date().getMonth() &&
                        day.getFullYear() === new Date().getFullYear();

                      const isSelected =
                        day.getDate() === selectedDate.getDate() &&
                        day.getMonth() === selectedDate.getMonth() &&
                        day.getFullYear() === selectedDate.getFullYear();

                      const hasBookings = hasBookingsOnDate(day);

                      return (
                        <button
                          key={`day-${monthIdx}-${dayIdx}`}
                          type="button"
                          onClick={() => handleYearlyDayClick(day)}
                          className={cn(
                            "h-6 w-full rounded-md flex items-center justify-center font-medium transition-all hover:bg-muted/80 cursor-pointer relative",
                            isSelected
                              ? "bg-primary text-white font-bold"
                              : isToday
                              ? "border border-primary text-primary"
                              : "text-foreground",
                            hasBookings && !isSelected && "bg-red-500/10"
                          )}
                        >
                          <span>{day.getDate()}</span>
                          {hasBookings && (
                            <span
                              className={cn(
                                "absolute bottom-0.5 w-1 h-1 rounded-full",
                                isSelected ? "bg-white" : "bg-red-500"
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Form (Displays when a slot is selected) */}
      {selectedSlot && (
        <Card className="border border-primary/20 bg-primary/5 p-4 rounded-xl space-y-4 animate-in fade-in-50 duration-200">
      {isImmediate && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5 w-full">
          <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
          <span>{t("immediate_booking_notice")}</span>
        </div>
      )}
      <div className="flex items-start justify-between border-b border-border/40 pb-2">
        <div>
          <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            {t("book_car_slot")}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("selected_slot")}: <span className="font-bold text-foreground">{selectedSlot.date.toLocaleDateString(getLocale(), { weekday: "short", month: "short", day: "numeric" })}</span> at <span className="font-mono font-bold text-foreground bg-primary/10 px-1.5 py-0.5 rounded">{selectedSlot.label}</span>
          </p>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs cursor-pointer" onClick={() => setSelectedSlot(null)}>
          {t("clear_selection")}
        </Button>
      </div>

      {/* Start and End Times Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/40 border border-border/40 rounded-lg text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            {t("start_time")}
          </label>
          <input
            type="datetime-local"
            value={manualStartTime}
            onChange={(e) => setManualStartTime(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50 cursor-pointer"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            {t("end_time")}
          </label>
          <input
            type="datetime-local"
            value={manualEndTime}
            onChange={(e) => setManualEndTime(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50 cursor-pointer"
            required
          />
        </div>
      </div>

          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Driver selector for Admin */}
              {currentUserRole === "ADMIN" ? (
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">{t("assign_driver")}</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={bookingDetails.driverId}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, driverId: e.target.value })}
                  >
                    <option value="" disabled>{t("select_driver")}</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">{t("purpose")}</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                  value={bookingDetails.purpose}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, purpose: e.target.value })}
                >
                  <option value="Corporate Duty">Corporate Duty</option>
                  <option value="Client Transport">Client Transport</option>
                  <option value="Airport Shuttle">Airport Shuttle</option>
                  <option value="Delivery / Goods Shuttle">Delivery / Goods Shuttle</option>
                  <option value="Other Operations">Other Operations</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">{t("pickup")}</label>
                <Input
                  placeholder="e.g. Headquarters / Airport"
                  value={bookingDetails.pickup}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, pickup: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">{t("dropoff")}</label>
                <Input
                  placeholder="e.g. Client Office / Terminal 3"
                  value={bookingDetails.destination}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, destination: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">{t("notes")}</label>
              <textarea
                className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                placeholder="Enter any passenger details, cargo requirements, or instructions..."
                value={bookingDetails.notes}
                onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedSlot(null)}>
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-primary text-white">
                {isPending ? t("booking_loading") : t("confirm_booking")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {formSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 flex items-center justify-center gap-2 animate-bounce">
          <Check className="h-5 w-5" />
          <span className="font-bold">{t("booking_confirmed_success")}</span>
        </div>
      )}

      {/* Booking History Table */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-primary" />
          Vehicle Booking History & Log
        </h4>
        <div className="max-h-60 overflow-auto border border-border/40 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground">
                <th className="p-3">Trip Ref</th>
                <th className="p-3">Booked Driver</th>
                <th className="p-3">Route</th>
                <th className="p-3">Time Range / Duration</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {historicalBookings.map((b) => (
                <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-mono font-bold">{b.tripNumber}</td>
                  <td className="p-3">
                    <div className="font-semibold">{b.driver?.name || "Unassigned"}</div>
                    <div className="text-[10px] text-muted-foreground">{b.driver?.employeeId || "ΓÇö"}</div>
                  </td>
                  <td className="p-3">
                    <div>{b.pickup} Γ₧ö {b.destination}</div>
                    <div className="text-[10px] text-muted-foreground italic">{b.purpose}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono font-semibold">
                      {new Date(b.startTime).toLocaleDateString()}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        b.status === "COMPLETED"
                          ? "success"
                          : b.status === "IN_PROGRESS"
                          ? "info"
                          : b.status === "CANCELLED"
                          ? "danger"
                          : "warning"
                      }
                      className="capitalize"
                    >
                      {b.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
              {historicalBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground italic">
                    No bookings logged for this vehicle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
