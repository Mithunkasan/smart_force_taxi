import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';
import { verifyPassword } from './lib/auth-utils';
import * as dotenv from 'dotenv';
dotenv.config();

function createPrismaClient() {
  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeon(sql as any);
  return new PrismaClient({ adapter });
}

const db = createPrismaClient();

async function main() {
  try {
    const user = await db.user.findUnique({
      where: { email: 'admin@mattengg.com' }
    });
    if (!user) {
      console.log("User not found!");
      return;
    }
    console.log("User password hash in DB:", user.password);
    
    const isValid = verifyPassword('Matt@4321admin', user.password);
    console.log("Is 'Matt@4321admin' correct?", isValid);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
