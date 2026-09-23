import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pgPool?: pg.Pool };

function createClient() {
  const pool =
    globalForPrisma.pgPool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return { client: new PrismaClient({ adapter }), pool };
}

const { client, pool } = globalForPrisma.prisma
  ? { client: globalForPrisma.prisma, pool: globalForPrisma.pgPool! }
  : createClient();

export const prisma = client;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
