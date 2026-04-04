import { z } from "zod";
import { router, publicProcedure } from "../trpc";

/**
 * Root tRPC router — composes all sub-routers.
 * Add new routers here as the app grows:
 *   import { productRouter } from "./product";
 *   product: productRouter,
 */
export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input.name}!` };
    }),

  echo: publicProcedure
    .input(z.string())
    .mutation(({ input }) => {
      return { echoed: input, at: new Date().toISOString() };
    }),
});

export type AppRouter = typeof appRouter;
