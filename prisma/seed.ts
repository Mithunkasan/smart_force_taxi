import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../lib/auth-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data in order of dependency
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.adminVerification.deleteMany({});
  await prisma.vehicleConditionReport.deleteMany({});
  await prisma.parkingLocation.deleteMany({});
  await prisma.tripClosing.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.carAssignment.deleteMany({});
  await prisma.driverShift.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Deleted existing records.');

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mattengg.com',
      password: hashPassword('Matt@4321admin'),
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      employeeId: 'EMP-001',
      phone: '+15550100',
      status: 'OFFLINE',
    },
  });
  console.log('Created Admin User:', admin.email);

  // Create Drivers
  const driverKumar = await prisma.user.create({
    data: {
      email: 'kumar@fleet.com',
      password: hashPassword('driverpassword'),
      name: 'Kumar',
      role: Role.DRIVER,
      employeeId: 'DRV-001',
      phone: '+919876543210',
      licenseNumber: 'DL-KUMAR12345',
      licenseExpiry: new Date('2030-12-31'),
      joiningDate: new Date('2026-01-01'),
      status: 'OFFLINE',
      shiftStartTime: '06:00 AM',
      shiftEndTime: '06:00 PM',
      shiftDuration: '12 Hours',
      experience: 5,
      emergencyContact: 'Sunita (+919876543211)',
    },
  });
  console.log('Created Driver Kumar:', driverKumar.email);

  const driverArun = await prisma.user.create({
    data: {
      email: 'arun@fleet.com',
      password: hashPassword('driverpassword'),
      name: 'Arun',
      role: Role.DRIVER,
      employeeId: 'DRV-002',
      phone: '+919876543220',
      licenseNumber: 'DL-ARUN12345',
      licenseExpiry: new Date('2031-06-30'),
      joiningDate: new Date('2026-02-15'),
      status: 'OFFLINE',
      shiftStartTime: '08:00 AM',
      shiftEndTime: '04:00 PM',
      shiftDuration: '8 Hours',
      experience: 3,
      emergencyContact: 'Vijay (+919876543221)',
    },
  });
  console.log('Created Driver Arun:', driverArun.email);

  const driverSuresh = await prisma.user.create({
    data: {
      email: 'suresh@fleet.com',
      password: hashPassword('driverpassword'),
      name: 'Suresh',
      role: Role.DRIVER,
      employeeId: 'DRV-003',
      phone: '+919876543230',
      licenseNumber: 'DL-SURESH12345',
      licenseExpiry: new Date('2029-09-15'),
      joiningDate: new Date('2026-03-10'),
      status: 'OFFLINE',
      shiftStartTime: '06:00 PM',
      shiftEndTime: '06:00 AM',
      shiftDuration: '12 Hours',
      experience: 7,
      emergencyContact: 'Kavita (+919876543231)',
    },
  });
  console.log('Created Driver Suresh:', driverSuresh.email);

  // Create Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'TN 01 AB 1234',
      name: 'Toyota Etios',
      brand: 'Toyota',
      model: 'Etios Liva',
      year: 2022,
      seatingCapacity: 5,
      registrationNumber: 'REG-TN01AB1234',
      insuranceExpiry: new Date('2027-05-10'),
      fcExpiry: new Date('2032-05-10'),
      pollutionExpiry: new Date('2027-02-10'),
      serviceDueDate: new Date('2026-11-15'),
      odometer: 45000,
      status: 'AVAILABLE',
      carType: 'Sedan',
      ownershipType: 'Rental',
      notes: 'Fuel efficient, daily run',
    },
  });
  console.log('Created Vehicle 1:', vehicle1.vehicleNumber);

  const vehicle2 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'TN 01 AB 5678',
      name: 'Swift Dzire',
      brand: 'Maruti Suzuki',
      model: 'Dzire VXI',
      year: 2021,
      seatingCapacity: 5,
      registrationNumber: 'REG-TN01AB5678',
      insuranceExpiry: new Date('2027-08-20'),
      fcExpiry: new Date('2031-08-20'),
      pollutionExpiry: new Date('2026-12-20'),
      serviceDueDate: new Date('2026-10-05'),
      odometer: 62000,
      status: 'AVAILABLE',
      carType: 'Sedan',
      ownershipType: 'Own',
      notes: 'Well maintained, smooth ride',
    },
  });
  console.log('Created Vehicle 2:', vehicle2.vehicleNumber);

  const vehicle3 = await prisma.vehicle.create({
    data: {
      vehicleNumber: 'TN 01 AB 9012',
      name: 'Innova Crysta',
      brand: 'Toyota',
      model: 'Crysta 2.4V',
      year: 2023,
      seatingCapacity: 7,
      registrationNumber: 'REG-TN01AB9012',
      insuranceExpiry: new Date('2028-01-15'),
      fcExpiry: new Date('2033-01-15'),
      pollutionExpiry: new Date('2027-07-15'),
      serviceDueDate: new Date('2026-12-30'),
      odometer: 18000,
      status: 'AVAILABLE',
      carType: 'SUV',
      ownershipType: 'Own',
      notes: 'Premium fleet vehicle, 7-seater',
    },
  });
  console.log('Created Vehicle 3:', vehicle3.vehicleNumber);

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
