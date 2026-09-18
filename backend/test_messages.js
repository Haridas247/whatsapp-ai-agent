const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.message.findMany({ orderBy: { created_at: 'desc' }, take: 10 }).then(console.log).catch(console.error);
