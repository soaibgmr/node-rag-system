// Seed using node-postgres directly to avoid importing generated TypeScript Prisma client
const fs = require('fs');
const { Client } = require('pg');

const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const match = env.match(/DATABASE_URL=(.+)/);
const connectionString = process.env.DATABASE_URL || (match && match[1] && match[1].trim());

if (!connectionString) {
  console.error('DATABASE_URL not found in environment or .env');
  process.exit(1);
}

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();

    // Roles
    const roles = [
      { name: 'ADMIN', description: 'Administrator' },
      { name: 'USER', description: 'Regular user' },
    ];

    const { randomUUID } = require('crypto');
    for (const r of roles) {
      const res = await client.query('SELECT id FROM roles WHERE name = $1', [r.name]);
      if (res.rowCount === 0) {
        const id = randomUUID();
        const now = new Date().toISOString();
        await client.query('INSERT INTO roles (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)', [
          id,
          r.name,
          r.description,
          now,
        ]);
        console.log('Inserted role', r.name);
      }
    }

    // Countries
    const countries = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'countries.sample.json'), 'utf8'));
    let inserted = 0;
    for (const c of countries) {
      const res = await client.query('SELECT code_iso3 FROM countries WHERE code_iso3 = $1', [c.codeIso3]);
      if (res.rowCount === 0) {
        const now = new Date().toISOString();
        await client.query('INSERT INTO countries (code_iso3, name, code, created_at) VALUES ($1, $2, $3, $4)', [c.codeIso3, c.name, c.code, now]);
        inserted++;
      }
    }
    console.log(`Inserted ${inserted} countries`);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
