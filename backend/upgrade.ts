import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.user.update({
    where: { email: 'admin@kumardental.com' },
    data: { role: 'SUPERADMIN' }
  });
  console.log('Upgraded to SUPERADMIN');
}
run().finally(() => prisma.$disconnect());
