import { z } from "zod";
import { router, publicProcedure } from "../trpc";

/**
 * Root router with Prisma integration.
 * ctx.db is the Prisma client — fully typed.
 */
export const appRouter = router({
  users: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
    }),

    create: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.db.user.create({ data: input });
      }),
  }),

  products: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.db.product.findMany({ orderBy: { createdAt: "desc" } });
    }),
  }),
});

export type AppRouter = typeof appRouter;
