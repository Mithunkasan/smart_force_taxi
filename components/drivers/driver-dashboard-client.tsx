"use client";

import React, { useState, useEffect, useTransition } from "react";
import { User, Vehicle, Trip, DriverShift } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { startDriverShiftAction, endDriverShiftAction, pickVehicleAction, releaseVehicleAction } from "@/actions/shifts";
import { driverCreateWorkAction, driverAcceptWorkAction, driverStartWorkAction, driverCompleteWorkAction, driverCompleteTripWithDetailsAction, bookCarAction } from "@/actions/driver-trips";
import { Clock, ShieldAlert, Award, Calendar, AlertCircle, MapPin, Truck, HelpCircle, Navigation, Milestone, DollarSign, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "@/components/layout/language-provider";
import { useRouter } from "next/navigation";

interface DriverDashboardClientProps {
  driver: User;
  activeShift: DriverShift | null;
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
  const [timeElapsed, setTimeElapsed] = useState("00:00:00");
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<"ALL" | "AVAILABLE" | "ON_TRIP">("ALL");
  const [datesList, setDatesList] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);

    // Generate dates list (5 days)
    const list = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    setDatesList(list);

    // Sunday Popup check
    if (new Date().getDay() === 0) {
      const dismissed = sessionStorage.getItem("sunday_popup_dismissed");
      if (!dismissed) {
        setShowSundayPopup(true);
      }
    }

    return () => clearInterval(timer);
  }, []);

  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  const [isCompleteFormOpen, setIsCompleteFormOpen] = useState(false);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);
  const [showOnlyAvailableNow, setShowOnlyAvailableNow] = useState(false);

  const isCarAvailableNow = (car: Vehicle) => {
    if (car.status !== "AVAILABLE") return false;
    const now = new Date();
    const isBookedNow = bookings.some((b) => {
      if (b.vehicleId !== car.id) return false;
      if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start <= now && end > now;
    });
    return !isBookedNow;
  };

  // Form State for self-assign work
  const [workData, setWorkData] = useState({
    purpose: "Corporate Duty",
    pickup: "",
    destination: "",
    startGpsUrl: "",
    destinationGpsUrl: "",
    notes: "",
  });

  const [closingData, setClosingData] = useState({
    endingOdometer: "",
    fuelExpense: "0",
    tollExpense: "0",
    parkingCharges: "0",
    allowance: "0",
    otherExpenses: "0",
    billsUrl: "",
    receiptsUrl: "",
    remarks: "",
  });

  const [parkingData, setParkingData] = useState({
    location: "",
    address: "",
    landmark: "",
    googleMapsLink: "",
  });

  const [conditionData, setConditionData] = useState({
    fuelLevel: "3/4",
    tyreCondition: "Good",
    interiorCondition: "Clean",
    exteriorCondition: "Good",
    remarks: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleCompleteTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeTrip || !assignedVehicle) return;

    const startOdo = activeTrip.vehicle.odometer;
    const endOdo = parseInt(closingData.endingOdometer, 10);

    if (isNaN(endOdo)) {
      setFormError("Ending Odometer must be a valid number.");
      return;
    }

    if (endOdo < startOdo) {
      setFormError(`Ending Odometer (${endOdo} km) cannot be less than Starting Odometer (${startOdo} km).`);
      return;
    }

    if (!parkingData.location || !parkingData.address) {
      setFormError("Please fill out the parking location name and address.");
      return;
    }

    const distanceTravelled = endOdo - startOdo;

    startTransition(async () => {
      const res = await driverCompleteTripWithDetailsAction(
        activeTrip.id,
        assignedVehicle.id,
        driver.id,
        {
          startingOdometer: startOdo,
          endingOdometer: endOdo,
          distanceTravelled,
          tripAmount: 0.0,
          fuelExpense: parseFloat(closingData.fuelExpense) || 0.0,
          tollExpense: parseFloat(closingData.tollExpense) || 0.0,
          parkingCharges: parseFloat(closingData.parkingCharges) || 0.0,
          allowance: parseFloat(closingData.allowance) || 0.0,
          otherExpenses: parseFloat(closingData.otherExpenses) || 0.0,
          billsUrl: closingData.billsUrl || undefined,
          receiptsUrl: closingData.receiptsUrl || undefined,
          remarks: closingData.remarks || undefined,
        },
        parkingData,
        conditionData
      );

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsCompleteFormOpen(false);
      }
    });
  };

  // Running clock duration since active trip start
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== "IN_PROGRESS" || !activeTrip.actualStartTime) {
      setTimeElapsed("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      const checkInTime = new Date(activeTrip.actualStartTime!).getTime();
      const now = Date.now();
      const diffMs = now - checkInTime;

      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted = [
        String(hrs).padStart(2, "0"),
        String(mins).padStart(2, "0"),
        String(secs).padStart(2, "0"),
      ].join(":");

      setTimeElapsed(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrip]);

  const handleStartShift = () => {
    startTransition(async () => {
      const res = await startDriverShiftAction(driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleEndShift = () => {
    if (!confirm("Are you sure you want to end your shift? If you have an assigned vehicle, it will be automatically released.")) return;
    startTransition(async () => {
      const res = await endDriverShiftAction(driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handlePickCar = (vehicleId: string) => {
    startTransition(async () => {
      const res = await pickVehicleAction(driver.id, vehicleId);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleReleaseCar = () => {
    if (!assignedVehicle) return;
    if (!confirm("Are you sure you want to release this vehicle?")) return;
    startTransition(async () => {
      const res = await releaseVehicleAction(driver.id, assignedVehicle.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleAcceptWork = () => {
    if (!activeTrip) return;
    startTransition(async () => {
      const res = await driverAcceptWorkAction(activeTrip.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleStartWork = () => {
    if (!activeTrip) return;
    startTransition(async () => {
      const res = await driverStartWorkAction(activeTrip.id, activeTrip.vehicleId, driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleStartWorkForTrip = (tripId: string, vehicleId: string) => {
    startTransition(async () => {
      const res = await driverStartWorkAction(tripId, vehicleId, driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleCompleteWork = () => {
    if (!activeTrip) return;
    startTransition(async () => {
      const res = await driverCompleteWorkAction(activeTrip.id, activeTrip.vehicleId, driver.id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  const handleWorkFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!workData.pickup || !workData.destination) {
      setFormError("Please enter both pickup and destination locations.");
      return;
    }

    startTransition(async () => {
      const res = await driverCreateWorkAction(driver.id, workData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsWorkFormOpen(false);
        setWorkData({
          purpose: "Corporate Duty",
          pickup: "",
          destination: "",
          startGpsUrl: "",
          destinationGpsUrl: "",
          notes: "",
        });
      }
    });
  };

  // Status labels
  const getDriverStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">{t("available")}</Badge>;
      case "ON_TRIP":
        return <Badge variant="info">{t("on_trip_busy")}</Badge>;
      case "ON_BREAK":
        return <Badge variant="warning">{t("on_break")}</Badge>;
      case "OFF_DUTY":
        return <Badge variant="secondary">{t("off_duty")}</Badge>;
      case "OFFLINE":
      default:
        return <Badge variant="danger">{t("offline")}</Badge>;
    }
  };

  const isShiftActive = driver.status !== "OFFLINE";
  const shouldShowActiveWork = !activeTrip || !mounted || currentTime >= new Date(activeTrip.startTime);

  // Vehicle Counts
  const availableCount = vehicles.filter(v => v.status === "AVAILABLE").length;
  const onTripCount = vehicles.filter(v => v.status === "ON_TRIP").length;

  const filteredVehicles = vehicles.filter((car) => {
    if (vehicleFilter === "AVAILABLE") return car.status === "AVAILABLE";
    if (vehicleFilter === "ON_TRIP") return car.status === "ON_TRIP";
    return true;
  });

  const activeVehicle = selectedVehicle || filteredVehicles[0] || vehicles[0] || null;
  const activeVehicleForDisplay = activeVehicle && filteredVehicles.some(v => v.id === activeVehicle.id) 
    ? activeVehicle 
    : filteredVehicles[0] || vehicles[0] || null;

  // Active Vehicle Bookings for the selected date
  const activeVehicleBookings = bookings.filter((b) => {
    if (!activeVehicleForDisplay || b.vehicleId !== activeVehicleForDisplay.id || b.status === "CANCELLED" || b.status === "COMPLETED") return false;
    const bStart = new Date(b.startTime);
    return bStart.getFullYear() === selectedDate.getFullYear() &&
           bStart.getMonth() === selectedDate.getMonth() &&
           bStart.getDate() === selectedDate.getDate();
  });

  // Calculate work duration today
  const today = new Date();
  const todayBookings = bookings.filter((b) => {
    if (b.driverId !== driver.id || b.status === "CANCELLED" || b.status === "COMPLETED") return false;
    const bStart = new Date(b.startTime);
    return bStart.getFullYear() === today.getFullYear() &&
           bStart.getMonth() === today.getMonth() &&
           bStart.getDate() === today.getDate();
  });

  const totalTodayDurationHours = todayBookings.reduce((sum, b) => {
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);

  const getDurationStatusElement = () => {
    if (totalTodayDurationHours === 0) return null;

    let colorClass = "bg-muted/10 border-border text-muted-foreground";
    let statusText = `${totalTodayDurationHours.toFixed(1)} Hours Shift`;

    if (totalTodayDurationHours < 6) {
      colorClass = "bg-red-500/10 border-red-500/20 text-red-500";
      statusText = `Today's Booking Duration: ${totalTodayDurationHours.toFixed(1)} Hours (Less than 6 hours)`;
    } else if (totalTodayDurationHours >= 6 && totalTodayDurationHours < 10) {
      colorClass = "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      statusText = `Today's Booking Duration: ${totalTodayDurationHours.toFixed(1)} Hours (8 hours shift)`;
    } else if (totalTodayDurationHours >= 10) {
      colorClass = "bg-green-500/10 border-green-500/20 text-green-500";
      statusText = `Today's Booking Duration: ${totalTodayDurationHours.toFixed(1)} Hours (12 hours shift)`;
    }

    return (
      <div className={cn("p-3 rounded-xl border text-xs font-bold flex items-center gap-2", colorClass)}>
        <Clock className="h-4 w-4 shrink-0" />
        <p>{statusText}</p>
      </div>
    );
  };

  const slotsList = [
    { label: "12:00 AM", startHour: 0, endHour: 2 },
    { label: "02:00 AM", startHour: 2, endHour: 4 },
    { label: "04:00 AM", startHour: 4, endHour: 6 },
    { label: "06:00 AM", startHour: 6, endHour: 8 },
    { label: "08:00 AM", startHour: 8, endHour: 10 },
    { label: "10:00 AM", startHour: 10, endHour: 12 },
    { label: "12:00 PM", startHour: 12, endHour: 14 },
    { label: "02:00 PM", startHour: 14, endHour: 16 },
    { label: "04:00 PM", startHour: 16, endHour: 18 },
    { label: "06:00 PM", startHour: 18, endHour: 20 },
    { label: "08:00 PM", startHour: 20, endHour: 22 },
    { label: "10:00 PM", startHour: 22, endHour: 24 },
  ];

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

    if (start < new Date()) {
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
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">{t("status")}:</span>
            {getDriverStatusLabel(driver.status)}
          </div>
        </div>
        <div className="text-xs space-y-2 md:border-l md:border-border/40 md:pl-6">
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground font-semibold">Driver Name:</span> <span className="font-bold text-foreground">{driver.name}</span></div>
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground font-semibold">License ID:</span> <span className="font-mono font-semibold text-foreground">{driver.licenseNumber}</span></div>
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground font-semibold">Expiry Date:</span> <span className="font-semibold text-foreground">{driver.licenseExpiry ? (mounted ? new Date(driver.licenseExpiry).toLocaleDateString() : "") : "N/A"}</span></div>
        </div>
      </div>

      {/* Fleet Vehicles Slot Booking Calendar (Design inspired by reference image) */}
      <Card className="border-border bg-card text-foreground">
        <CardHeader className="border-b border-border/30 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Fleet Vehicles Slot Booking
              </CardTitle>
              <CardDescription>Select a vehicle and pick a slot to book.</CardDescription>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Date Selector Row */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Select Date</span>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none items-center">
              {datesList.map((date, idx) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
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
                      "flex flex-col items-center justify-between p-3 min-w-[75px] h-[90px] rounded-xl border transition-all cursor-pointer",
                      isSelected 
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-md glow-primary" 
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{monthStr}</span>
                    <span className="text-xl font-extrabold">{dayNum}</span>
                    <span className="text-[9px] font-semibold">{dayName}</span>
                  </button>
                );
              })}
              
              {/* Custom Date Picker Card */}
              <div className="relative flex flex-col items-center justify-center p-3 min-w-[75px] h-[90px] border border-border rounded-xl cursor-pointer hover:border-primary/40 bg-card group transition-all">
                <Calendar className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-semibold text-muted-foreground mt-1">Pick Date</span>
                <input 
                  type="date" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value));
                      setClickedBookedSlot(null);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Selector Row */}
          <div className="space-y-2 border-t border-border/30 pt-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Select Vehicle</span>
            <div className="flex flex-wrap gap-2">
              {filteredVehicles.map((car) => {
                const isSelected = activeVehicleForDisplay?.id === car.id;
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
                      isSelected 
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-md glow-primary" 
                        : "border-border bg-card text-foreground hover:bg-muted/10"
                    )}
                  >
                    <Truck className="h-3.5 w-3.5 shrink-0" />
                    {car.name} ({car.vehicleNumber})
                  </button>
                );
              })}
              {filteredVehicles.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No vehicles in this category.</span>
              )}
            </div>
          </div>

          {activeVehicleForDisplay && (
            <>
              {/* Availability Timeline Visual Bar */}
              <div className="space-y-2 border-t border-border/30 pt-4">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  <span>Timeline: 12 AM</span>
                  <span className="text-foreground font-bold">Slide to check availability</span>
                  <span>12 PM</span>
                  <span>12 AM</span>
                </div>
                <div className="relative w-full h-5 bg-muted/30 rounded-lg border border-border/40 overflow-hidden">
                  {/* Booked ranges */}
                  {activeVehicleBookings.map((b) => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    const startMins = bStart.getHours() * 60 + bStart.getMinutes();
                    const endMins = bEnd.getHours() * 60 + bEnd.getMinutes();
                    const leftPercent = (startMins / 1440) * 100;
                    const widthPercent = Math.max(((endMins - startMins) / 1440) * 100, 2);
                    
                    return (
                      <div 
                        key={b.id}
                        className="absolute top-0 bottom-0 bg-red-600/80 hover:bg-red-600 transition-colors cursor-help border-l border-r border-red-700/30"
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        title={`Booked: ${bStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${bEnd.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-2 border-t border-border/30 pt-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Select Time Slot</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {slotsList.map((slot, index) => {
                    const slotStart = new Date(selectedDate);
                    slotStart.setHours(slot.startHour, 0, 0, 0);
                    const slotEnd = new Date(selectedDate);
                    slotEnd.setHours(slot.endHour, 0, 0, 0);
                    
                    const booking = activeVehicleBookings.find((b) => {
                      const bStart = new Date(b.startTime);
                      const bEnd = new Date(b.endTime);
                      return (bStart < slotEnd && bEnd > slotStart);
                    });
                    
                    const isBooked = !!booking;
                    const pad = (num: number) => String(num).padStart(2, '0');
                    const startStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T${pad(slot.startHour)}:00`;
                    const endStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T${pad(slot.endHour)}:00`;
                    
                    const isSelected = bookingTimes.startTime === startStr && bookingTimes.endTime === endStr;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (isBooked) {
                            setClickedBookedSlot(booking);
                          } else {
                            setBookingTimes({
                              ...bookingTimes,
                              startTime: startStr,
                              endTime: endStr,
                            });
                            setClickedBookedSlot(null);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[75px]",
                          isBooked 
                            ? "bg-red-600/80 border-red-700/30 text-white hover:bg-red-600" 
                            : isSelected
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-md glow-primary"
                              : "border-border bg-muted/10 hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <span className="text-[12px] font-bold">{slot.label}</span>
                        <span className="text-[9px] uppercase mt-1 tracking-wider font-semibold opacity-85">
                          {isBooked ? "Booked" : "Available"}
                        </span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">From</label>
                    <Input
                      type="datetime-local"
                      value={bookingTimes.startTime}
                      onChange={(e) => setBookingTimes({ ...bookingTimes, startTime: e.target.value })}
                      className="focus-visible:ring-primary text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">To</label>
                    <Input
                      type="datetime-local"
                      value={bookingTimes.endTime}
                      onChange={(e) => setBookingTimes({ ...bookingTimes, endTime: e.target.value })}
                      className="focus-visible:ring-primary text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Purpose of Booking</label>
                    <Input
                      type="text"
                      placeholder="e.g. Airport Pickup"
                      value={bookingTimes.purpose}
                      onChange={(e) => setBookingTimes({ ...bookingTimes, purpose: e.target.value })}
                      className="focus-visible:ring-primary text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1 flex items-end">
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

      {/* Grid below slot booking: Active Work & Upcoming Bookings */}
      <div className="grid gap-6 md:grid-cols-2 text-foreground">
        {/* Active Work / Trip Widget */}
        <Card className={cn("border-border bg-card flex flex-col justify-between", !shouldShowActiveWork && "hidden")}>
          <div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Navigation className="h-5 w-5 text-primary" />
                {t("current_active_work")}
              </CardTitle>
              <CardDescription>{t("active_work_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTrip ? (
                <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">{t("work_reference")}</span>
                      <span className="font-mono text-sm font-bold text-foreground">{activeTrip.tripNumber}</span>
                    </div>
                    <Badge variant={activeTrip.status === "IN_PROGRESS" ? "info" : "warning"}>
                      {activeTrip.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{t("pickup_location")}</span>
                      <span className="font-semibold text-foreground block">{activeTrip.pickup}</span>
                      {activeTrip.startGpsUrl && (
                        <a href={activeTrip.startGpsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold mt-1 inline-block">
                          View GPS Link ↗
                        </a>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t("destination")}:</span>
                      <span className="font-semibold text-foreground block">{activeTrip.destination}</span>
                      {activeTrip.destinationGpsUrl && (
                        <a href={activeTrip.destinationGpsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold mt-1 inline-block">
                          View GPS Link ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {activeTrip.notes && (
                    <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 mt-2">
                      <span className="font-semibold text-foreground block mb-0.5">{t("notes")}:</span>
                      {activeTrip.notes}
                    </div>
                  )}

                  {activeTrip.assignedBy === "ADMIN" && activeTrip.status === "ASSIGNED" && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 text-xs text-yellow-600 font-medium">
                      {t("admin_assigned_notice")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-muted/20 border border-border/40 rounded-xl">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">{t("no_active_work")}</p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0 border-t border-border/40 mt-4 flex gap-2">
            {activeTrip ? (
              <>
                {activeTrip.status === "ASSIGNED" && activeTrip.assignedBy === "ADMIN" && (
                  <Button onClick={handleAcceptWork} disabled={isPending} className="w-full bg-primary text-white">
                    Accept Work
                  </Button>
                )}
                {((activeTrip.status === "ASSIGNED" && activeTrip.assignedBy === "DRIVER") || activeTrip.status === "ACCEPTED") && (
                  <Button
                    onClick={handleStartWork}
                    disabled={isPending || (mounted && new Date() < new Date(activeTrip.startTime))}
                    className="w-full bg-primary text-white font-semibold"
                  >
                    {mounted && new Date() < new Date(activeTrip.startTime) ? "Too Early to Start" : "Start Work / Trip"}
                  </Button>
                )}
                {activeTrip.status === "IN_PROGRESS" && (
                  <Button onClick={() => {
                    setClosingData({
                      endingOdometer: String(activeTrip.vehicle.odometer || ""),
                      fuelExpense: "0",
                      tollExpense: "0",
                      parkingCharges: "0",
                      allowance: "0",
                      otherExpenses: "0",
                      billsUrl: "",
                      receiptsUrl: "",
                      remarks: "",
                    });
                    setParkingData({
                      location: "",
                      address: "",
                      landmark: "",
                      googleMapsLink: "",
                    });
                    setConditionData({
                      fuelLevel: "3/4",
                      tyreCondition: "Good",
                      interiorCondition: "Clean",
                      exteriorCondition: "Good",
                      remarks: "",
                    });
                    setFormError(null);
                    setIsCompleteFormOpen(true);
                  }} disabled={isPending} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {t("trip_completed")}
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={() => setIsWorkFormOpen(true)} disabled={isPending} className="w-full">
                {t("assign_new_work")}
              </Button>
            )}
          </div>
        </Card>

        {/* My Upcoming Bookings */}
        <Card className={cn("border-border bg-card flex flex-col justify-between", !shouldShowActiveWork && "col-span-full")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              {t("my_bookings_schedule")}
            </CardTitle>
            <CardDescription>{t("bookings_schedule_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {/* Work Duration Status Alert */}
            {getDurationStatusElement()}

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
                      📅 {new Date(b.startTime).toLocaleDateString()} · {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {activeTrip?.id !== b.id && b.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        className="w-full mt-2 font-semibold"
                        onClick={() => handleStartWorkForTrip(b.id, b.vehicleId)}
                        disabled={isPending || (mounted && new Date() < new Date(b.startTime))}
                      >
                        {mounted && new Date() < new Date(b.startTime) ? t("too_early_to_start") : t("start_booking_trip")}
                      </Button>
                    )}
                  </div>
                ))}
              {bookings.filter((b) => b.driverId === driver.id && b.status !== "COMPLETED" && b.status !== "CANCELLED").length === 0 && (
                <p className="text-xs text-muted-foreground text-center italic py-6">{t("no_upcoming_bookings")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Assign New Work Dialog */}
      <Dialog isOpen={isWorkFormOpen} onClose={() => setIsWorkFormOpen(false)} title="Assign New Work To Me">
        <form onSubmit={handleWorkFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Work / Trip Type</label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              value={workData.purpose}
              onChange={(e) => setWorkData({ ...workData, purpose: e.target.value })}
            >
              <option value="Corporate Duty">Corporate Duty</option>
              <option value="Client Transport">Client Transport</option>
              <option value="Airport Shuttle">Airport Shuttle</option>
              <option value="Delivery / Goods Shuttle">Delivery / Goods Shuttle</option>
              <option value="Other Operations">Other Operations</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Start Location</label>
              <Input
                placeholder="e.g. Chennai"
                value={workData.pickup}
                onChange={(e) => setWorkData({ ...workData, pickup: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Destination</label>
              <Input
                placeholder="e.g. Airport"
                value={workData.destination}
                onChange={(e) => setWorkData({ ...workData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Start GPS / Google Maps URL</label>
            <Input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={workData.startGpsUrl}
              onChange={(e) => setWorkData({ ...workData, startGpsUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Destination GPS / Google Maps URL</label>
            <Input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={workData.destinationGpsUrl}
              onChange={(e) => setWorkData({ ...workData, destinationGpsUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Notes / Remarks</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
              placeholder="Enter special instructions or notes..."
              value={workData.notes}
              onChange={(e) => setWorkData({ ...workData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsWorkFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              ASSIGN WORK TO ME
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Trip Completed Update Details Dialog */}
      <Dialog isOpen={isCompleteFormOpen} onClose={() => setIsCompleteFormOpen(false)} title="Trip Completed: Update Details" className="max-w-2xl">
        {activeTrip && (
          <form onSubmit={handleCompleteTripSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {formError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
                {formError}
              </div>
            )}

            {/* Odometer Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <Milestone className="h-4 w-4" /> Odometer Readings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Starting Odometer (km)</label>
                  <Input
                    type="number"
                    value={activeTrip.vehicle.odometer}
                    disabled
                    className="bg-muted/50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Ending Odometer (km)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 45150"
                    value={closingData.endingOdometer}
                    onChange={(e) => setClosingData({ ...closingData, endingOdometer: e.target.value })}
                    required
                    className="font-mono"
                    min={activeTrip.vehicle.odometer}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Calculated Distance: <span className="font-bold text-foreground font-mono">
                  {parseInt(closingData.endingOdometer, 10) >= activeTrip.vehicle.odometer 
                    ? parseInt(closingData.endingOdometer, 10) - activeTrip.vehicle.odometer 
                    : 0}
                </span> km
              </div>
            </div>

            {/* Expenses claims section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <DollarSign className="h-4 w-4" /> Trip Expenses & Allowance Claims
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Expense ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.fuelExpense}
                    onChange={(e) => setClosingData({ ...closingData, fuelExpense: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Receipt / Bill Proof Name</label>
                  <Input
                    placeholder="e.g. fuel_receipt.jpg"
                    value={closingData.billsUrl}
                    onChange={(e) => setClosingData({ ...closingData, billsUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Toll Expense ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.tollExpense}
                    onChange={(e) => setClosingData({ ...closingData, tollExpense: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Toll Receipt Proof Name</label>
                  <Input
                    placeholder="e.g. toll_receipt.png"
                    value={closingData.receiptsUrl}
                    onChange={(e) => setClosingData({ ...closingData, receiptsUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parking Charges ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.parkingCharges}
                    onChange={(e) => setClosingData({ ...closingData, parkingCharges: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Driver Allowance ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.allowance}
                    onChange={(e) => setClosingData({ ...closingData, allowance: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Other Expenses ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingData.otherExpenses}
                    onChange={(e) => setClosingData({ ...closingData, otherExpenses: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Remarks / Expenses Description</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Provide details about allowance claims, parking location, or other expenses..."
                    value={closingData.remarks}
                    onChange={(e) => setClosingData({ ...closingData, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Parking location section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <MapPin className="h-4 w-4" /> Parking Location (Vehicle Handover Spot)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Parking Location Name</label>
                  <Input
                    placeholder="e.g. Airport Terminal 3 Main Parking, Bay B-10"
                    value={parkingData.location}
                    onChange={(e) => setParkingData({ ...parkingData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Exact Address</label>
                  <Input
                    placeholder="e.g. Meenambakkam, Chennai, Tamil Nadu 600027"
                    value={parkingData.address}
                    onChange={(e) => setParkingData({ ...parkingData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Landmark / Parking Level</label>
                  <Input
                    placeholder="e.g. Near Pillar 45 / Level 2"
                    value={parkingData.landmark}
                    onChange={(e) => setParkingData({ ...parkingData, landmark: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Google Maps Link</label>
                  <Input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={parkingData.googleMapsLink}
                    onChange={(e) => setParkingData({ ...parkingData, googleMapsLink: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle condition section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-border pb-1">
                <Truck className="h-4 w-4" /> Vehicle Return Condition Report
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Fuel Level</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.fuelLevel}
                    onChange={(e) => setConditionData({ ...conditionData, fuelLevel: e.target.value })}
                  >
                    <option value="F">Full (F)</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="1/4">1/4</option>
                    <option value="E">Empty (E)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tyres Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.tyreCondition}
                    onChange={(e) => setConditionData({ ...conditionData, tyreCondition: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Worn">Worn</option>
                    <option value="Needs Replacement">Needs Replacement</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Interior Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.interiorCondition}
                    onChange={(e) => setConditionData({ ...conditionData, interiorCondition: e.target.value })}
                  >
                    <option value="Clean">Clean</option>
                    <option value="Needs Cleaning">Needs Cleaning</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Exterior Condition</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
                    value={conditionData.exteriorCondition}
                    onChange={(e) => setConditionData({ ...conditionData, exteriorCondition: e.target.value })}
                  >
                    <option value="Good">Good</option>
                    <option value="Scratches">Scratches</option>
                    <option value="Dents">Dents</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Condition Report Remarks</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                    placeholder="Enter any dents, scratches, cleanliness issues, or standard comments..."
                    value={conditionData.remarks}
                    onChange={(e) => setConditionData({ ...conditionData, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCompleteFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:glow-green">
                SUBMIT & COMPLETE TRIP
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
