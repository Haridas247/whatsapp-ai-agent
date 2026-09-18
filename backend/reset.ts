import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.updateMany({ data: { password_hash: hash } });
  console.log('Passwords reset to admin123');
}

run().finally(() => prisma.$disconnect());
