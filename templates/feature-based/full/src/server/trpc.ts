import { initTRPC } from "@trpc/server";
import { db } from "@/lib/db";

/**
 * tRPC context includes the Prisma db client.
 * Access db in any procedure via ctx.db.
 */
export async function createContext() {
  return { db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
