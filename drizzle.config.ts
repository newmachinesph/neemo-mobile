import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/tables.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
} satisfies Config;
