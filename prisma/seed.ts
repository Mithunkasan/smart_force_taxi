import { PrismaClient, Role, VehicleStatus, TripStatus, Priority, VerificationStatus } from '@prisma/client';
import { hashPassword } from '../lib/auth-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.adminVerification.deleteMany({});
  await prisma.vehicleConditionReport.deleteMany({});
  await prisma.parkingLocation.deleteMany({});
  await prisma.tripClosing.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Deleted existing records.');

  // Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@fleet.com',
      password: hashPassword('adminpassword'),
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      employeeId: 'EMP-001',
      phone: '+15550100',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@fleet.com',
      password: hashPassword('managerpassword'),
      name: 'Transport Manager',
      role: Role.TRANSPORT_MANAGER,
      employeeId: 'EMP-002',
      phone: '+15550101',
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: 'john@driver.com',
      password: hashPassword('driverpassword'),
      name: 'John Doe',
      role: Role.DRIVER,
      employeeId: 'DRV-001',
      phone: '+15550102',
      licenseNumber: 'DL-12345ABC',
      licenseExpiry: new Date('2028-12-31'),
      experience: 5,
      shift: 'Morning',
      emergencyContact: 'Jane Doe (+15550103)',
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'bob@driver.com',
      password: hashPassword('driverpassword'),
      name: 'Bob Smith',
      role: Role.DRIVER,
      employeeId: 'DRV-002',
      phone: '+15550104',
      licenseNumber: 'DL-67890DEF',
      licenseExpiry: new Date('2029-06-15'),
      experience: 8,
      shift: 'Evening',
      emergencyContact: 'Mary Smith (+15550105)',
    },
  });

  const driver3 = await prisma.user.create({
    data: {
      email: 'alice@driver.com',
      password: hashPassword('driverpassword'),
      name: 'Alice Johnson',
      role: Role.DRIVER,
      employeeId: 'DRV-003',
      phone: '+15550106',
      licenseNumber: 'DL-54321GHI',
      licenseExpiry: new Date('2027-04-20'),
      experience: 3,
      shift: 'Night',
      emergencyContact: 'Fred Johnson (+15550107)',
    },
  });

  console.log('Created Users.');

  // Create Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'DL-1CA-1234',
      name: 'Innova Crysta',
      brand: 'Toyota',
      model: '2.4 VX',
      year: 2022,
      seatingCapacity: 7,
      registrationNumber: 'REG-INNOVA-2022',
      insuranceExpiry: new Date('2027-05-10'),
      fcExpiry: new Date('2027-10-15'),
      pollutionExpiry: new Date('2026-11-20'),
      serviceDueDate: new Date('2026-09-01'),
      odometer: 45200,
      status: VehicleStatus.AVAILABLE,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'DL-3CC-5678',
      name: 'Scorpio Classic',
      brand: 'Mahindra',
      model: 'S11',
      year: 2023,
      seatingCapacity: 7,
      registrationNumber: 'REG-SCORPIO-2023',
      insuranceExpiry: new Date('2027-08-25'),
      fcExpiry: new Date('2028-02-10'),
      pollutionExpiry: new Date('2026-10-05'),
      serviceDueDate: new Date('2026-08-15'),
      odometer: 12500,
      status: VehicleStatus.ASSIGNED,
      currentDriverId: driver2.id,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'MH-12-TR-9999',
      name: 'Prima Heavy Duty',
      brand: 'Tata',
      model: '4028.S',
      year: 2021,
      seatingCapacity: 2,
      registrationNumber: 'REG-PRIMA-2021',
      insuranceExpiry: new Date('2026-12-30'),
      fcExpiry: new Date('2027-03-14'),
      pollutionExpiry: new Date('2026-09-10'),
      serviceDueDate: new Date('2026-08-05'),
      odometer: 85600,
      status: VehicleStatus.ON_TRIP,
      currentDriverId: driver1.id,
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'MH-02-CP-4321',
      name: 'i20 Asta',
      brand: 'Hyundai',
      model: '1.2 Asta',
      year: 2023,
      seatingCapacity: 5,
      registrationNumber: 'REG-I20-2023',
      insuranceExpiry: new Date('2027-09-12'),
      fcExpiry: new Date('2028-09-12'),
      pollutionExpiry: new Date('2026-12-15'),
      serviceDueDate: new Date('2026-07-10'),
      odometer: 15400,
      status: VehicleStatus.MAINTENANCE,
    },
  });

  console.log('Created Vehicles.');

  // Create Trips
  // Trip 1: Historical completed trip (John Doe, Innova, Mumbai to Pune)
  const trip1 = await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1001',
      requestedBy: 'Marketing Team',
      department: 'Sales',
      pickup: 'Mumbai Corporate Office',
      destination: 'Pune Regional Hub',
      startTime: new Date('2026-07-24T08:00:00Z'),
      endTime: new Date('2026-07-24T14:00:00Z'),
      purpose: 'Client Meet & Product Launch Presentation',
      priority: Priority.MEDIUM,
      status: TripStatus.COMPLETED,
      driverId: driver1.id,
      vehicleId: vehicle1.id,
    },
  });

  // Create Trip Closing data for Trip 1
  await prisma.tripClosing.create({
    data: {
      tripId: trip1.id,
      startingOdometer: 44900,
      endingOdometer: 45200,
      distanceTravelled: 300,
      tripAmount: 7500.0,
      fuelExpense: 2800.0,
      tollExpense: 450.0,
      parkingCharges: 100.0,
      otherExpenses: 150.0,
      billsUrl: '/uploads/receipt_1001_fuel.jpg',
      receiptsUrl: '/uploads/receipt_1001_toll.jpg',
      remarks: 'Smooth trip, no delays on express highway.',
    },
  });

  // Parking Location
  await prisma.parkingLocation.create({
    data: {
      tripId: trip1.id,
      location: 'Pune Regional Office Parking',
      address: 'Plot 42, Hinjewadi Phase 1, Pune',
      landmark: 'Next to Wipro Circle',
      googleMapsLink: 'https://maps.google.com/?q=18.5910,73.7400',
      vehiclePhotoUrl: '/uploads/vehicle_1001.jpg',
    },
  });

  // Vehicle Condition
  await prisma.vehicleConditionReport.create({
    data: {
      tripId: trip1.id,
      fuelLevel: '1/2',
      tyreCondition: 'Good',
      interiorCondition: 'Clean',
      exteriorCondition: 'Good',
      remarks: 'Clean and ready for next assignment.',
    },
  });

  // Admin Verification
  await prisma.adminVerification.create({
    data: {
      tripId: trip1.id,
      status: VerificationStatus.VERIFIED,
      remarks: 'Odometer readings match trip logs. Approved expenses.',
      verifiedById: superAdmin.id,
    },
  });

  // Trip 2: Mismatched trip pending review (Bob Smith, Scorpio, Delhi to Agra)
  const trip2 = await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1002',
      requestedBy: 'Operations',
      department: 'Logistics',
      pickup: 'Delhi Warehouse',
      destination: 'Agra Delivery Site',
      startTime: new Date('2026-07-25T07:00:00Z'),
      endTime: new Date('2026-07-25T13:00:00Z'),
      purpose: 'Urgent Spare Parts Delivery',
      priority: Priority.HIGH,
      status: TripStatus.COMPLETED,
      driverId: driver2.id,
      vehicleId: vehicle2.id,
    },
  });

  await prisma.tripClosing.create({
    data: {
      tripId: trip2.id,
      startingOdometer: 12000,
      endingOdometer: 12500, // 500km recorded, but actual distance is 240km. Mismatch!
      distanceTravelled: 500,
      tripAmount: 12000.0,
      fuelExpense: 6500.0, // High fuel expense claimed
      tollExpense: 800.0,
      parkingCharges: 200.0,
      otherExpenses: 1500.0,
      remarks: 'Traffic jams, took a detour through side routes.',
    },
  });

  await prisma.parkingLocation.create({
    data: {
      tripId: trip2.id,
      location: 'Agra Site A Parking',
      address: 'Industrial Area Sector C, Agra',
      landmark: 'Behind Taj Food Court',
      googleMapsLink: 'https://maps.google.com/?q=27.1767,78.0081',
      vehiclePhotoUrl: '/uploads/vehicle_1002.jpg',
    },
  });

  await prisma.vehicleConditionReport.create({
    data: {
      tripId: trip2.id,
      fuelLevel: '1/4',
      tyreCondition: 'Worn',
      interiorCondition: 'Clean',
      exteriorCondition: 'Scratches',
      remarks: 'Rear left tyre looks worn out. Scratched bumper on detour.',
    },
  });

  await prisma.adminVerification.create({
    data: {
      tripId: trip2.id,
      status: VerificationStatus.PENDING,
      remarks: 'Pending review. Distance travelled (500 km) is excessive for Delhi-Agra direct route (240 km).',
    },
  });

  // Trip 3: Active Ongoing Trip (John Doe, Tata Prima, Surat to Indore)
  const trip3 = await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1003',
      requestedBy: 'Procurement',
      department: 'Supply Chain',
      pickup: 'Surat Steel Factory',
      destination: 'Indore Assembly Plant',
      startTime: new Date('2026-07-26T06:00:00Z'),
      endTime: new Date('2026-07-27T18:00:00Z'),
      purpose: 'Raw Metal Consignment Transport',
      priority: Priority.HIGH,
      status: TripStatus.STARTED,
      driverId: driver1.id,
      vehicleId: vehicle3.id,
    },
  });

  // Trip 4: Scheduled Trip (Bob Smith, Scorpio, Delhi to Gurgaon)
  const trip4 = await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1004',
      requestedBy: 'HR Team',
      department: 'Human Resources',
      pickup: 'Delhi HQ',
      destination: 'Gurgaon Office',
      startTime: new Date('2026-07-27T09:00:00Z'),
      endTime: new Date('2026-07-27T12:00:00Z'),
      purpose: 'Inter-office HR Training Event',
      priority: Priority.LOW,
      status: TripStatus.ASSIGNED,
      driverId: driver2.id,
      vehicleId: vehicle2.id,
    },
  });

  // Trip 5: Pending approval trip
  const trip5 = await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1005',
      requestedBy: 'Sales Team',
      department: 'Marketing',
      pickup: 'Mumbai Office',
      destination: 'Thane Store',
      startTime: new Date('2026-07-28T10:00:00Z'),
      endTime: new Date('2026-07-28T14:00:00Z'),
      purpose: 'Promotional Canopy Materials Transport',
      priority: Priority.LOW,
      status: TripStatus.PENDING,
      driverId: driver3.id,
      vehicleId: vehicle1.id,
    },
  });

  console.log('Created Trips.');

  // Create Maintenance Records
  await prisma.maintenance.create({
    data: {
      vehicleId: vehicle4.id, // i20 in maintenance
      serviceHistory: 'Full engine checkup, wheel alignment, and clutch adjustment.',
      nextServiceDate: new Date('2026-10-10'),
      oilChangeDone: true,
      tyresChanged: false,
      batteryChanged: true,
      repairCost: 8500.0,
      garageDetails: 'Hyundai Service Center, Andheri West, Mumbai',
    },
  });

  await prisma.maintenance.create({
    data: {
      vehicleId: vehicle1.id, // Innova completed service earlier
      serviceHistory: 'Routine 40k miles service, oil change, brake pad cleaning.',
      nextServiceDate: new Date('2026-09-01'),
      oilChangeDone: true,
      tyresChanged: true,
      batteryChanged: false,
      repairCost: 12400.0,
      garageDetails: 'Apex Auto Garage, Lower Parel',
    },
  });

  console.log('Created Maintenance Logs.');

  // Create Fuel Logs
  await prisma.fuelLog.create({
    data: {
      date: new Date('2026-07-24T09:30:00Z'),
      vehicleId: vehicle1.id,
      driverId: driver1.id,
      quantity: 35.5, // Liters
      cost: 3200.0,
      mileage: 12.5, // km/l
    },
  });

  await prisma.fuelLog.create({
    data: {
      date: new Date('2026-07-25T11:00:00Z'),
      vehicleId: vehicle2.id,
      driverId: driver2.id,
      quantity: 48.0,
      cost: 4500.0,
      mileage: 10.2,
    },
  });

  console.log('Created Fuel Logs.');

  // Create Attendance
  // Active clock in for John Doe today
  await prisma.attendance.create({
    data: {
      driverId: driver1.id,
      checkIn: new Date('2026-07-26T05:30:00Z'),
    },
  });

  // Completed attendance logs
  await prisma.attendance.create({
    data: {
      driverId: driver1.id,
      checkIn: new Date('2026-07-25T08:00:00Z'),
      checkOut: new Date('2026-07-25T17:00:00Z'),
      workingHours: 9.0,
      overtime: 1.0,
    },
  });

  await prisma.attendance.create({
    data: {
      driverId: driver2.id,
      checkIn: new Date('2026-07-25T09:00:00Z'),
      checkOut: new Date('2026-07-25T18:00:00Z'),
      workingHours: 9.0,
      overtime: 1.0,
    },
  });

  console.log('Created Attendance Records.');

  // Create Notifications
  await prisma.notification.create({
    data: {
      userId: superAdmin.id,
      message: 'New Trip Closing submitted for TRP-1002 requires verification.',
      type: 'VERIFICATION_PENDING',
    },
  });

  await prisma.notification.create({
    data: {
      userId: driver2.id,
      message: 'You have been assigned to trip TRP-1004 scheduled for tomorrow.',
      type: 'VEHICLE_ASSIGNMENT',
    },
  });

  await prisma.notification.create({
    data: {
      userId: superAdmin.id,
      message: 'Vehicle DL-3CC-5678 (Scorpio Classic) is due for service in 20 days.',
      type: 'MAINTENANCE_DUE',
    },
  });

  console.log('Created Notifications.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
