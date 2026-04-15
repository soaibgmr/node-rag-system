import 'dotenv/config';
import path from 'path';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  prisma: {
    schema: path.join(__dirname, 'src', 'prisma', 'schema'),
    datasource: {
      // Read DATABASE_URL from environment (.env.local)
      url: env('DATABASE_URL'),
    },
  },
});
