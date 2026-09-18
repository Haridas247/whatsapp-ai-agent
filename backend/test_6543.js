const { PrismaClient } = require('@prisma/client');

async function test(url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const user = await prisma.user.findFirst();
    console.log(`Success: ${url.split('@')[1]}`);
  } catch (e) {
    console.error(`Failed: ${url.split('@')[1]} - ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await test('postgresql://postgres.lkepxdaaiytrosbmlwyz:Bizs%40%282026%29@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true');
  await test('postgresql://postgres.lkepxdaaiytrosbmlwyz:expo%23%40%28247%29@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true');
}

run();
