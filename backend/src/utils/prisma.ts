import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Create a native Node-Postgres connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Wrap it with Prisma's driver adapter
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma Client with the adapter
export const prisma = new PrismaClient({ adapter });