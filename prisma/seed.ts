import { PrismaClient, Role } from '@prisma/client';
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
  await prisma.user.create({
    data: {
      email: 'admin@mattengg.com',
      password: hashPassword('Matt@4321admin'),
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      employeeId: 'EMP-001',
      phone: '+15550100',
    },
  });

  console.log('Created Admin User.');
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

