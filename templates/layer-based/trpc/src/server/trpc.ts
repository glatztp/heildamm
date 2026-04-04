import { initTRPC } from "@trpc/server";

/**
 * tRPC initialization.
 * Add context (session, db) here when needed:
 *   const t = initTRPC.context<Context>().create();
 */
const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
