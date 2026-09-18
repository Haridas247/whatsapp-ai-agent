const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.business.findMany().then(console.log).catch(console.error);
