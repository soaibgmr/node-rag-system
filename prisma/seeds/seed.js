/* Seed script for roles and countries
   Usage: node prisma/seeds/seed.js
   It reads DATABASE_URL from environment (.env) so ensure it's set.
*/
const { PrismaClient } = require('../src/prisma/generated/prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function seed() {
  try {
    // Roles
    const roles = [
      { name: 'ADMIN', description: 'Administrator' },
      { name: 'USER', description: 'Regular user' },
    ];

    for (const r of roles) {
      const exists = await prisma.role.findUnique({ where: { name: r.name } });
      if (!exists) {
        await prisma.role.create({ data: r });
        console.log('Inserted role', r.name);
      }
    }

    // Countries from sample JSON
    const countries = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'countries.sample.json'), 'utf8'));
    let inserted = 0;
    for (const c of countries) {
      const exists = await prisma.country.findUnique({ where: { codeIso3: c.codeIso3 } });
      if (!exists) {
        await prisma.country.create({ data: { name: c.name, code: c.code, codeIso3: c.codeIso3 } });
        inserted++;
      }
    }
    console.log(`Inserted ${inserted} countries`);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
