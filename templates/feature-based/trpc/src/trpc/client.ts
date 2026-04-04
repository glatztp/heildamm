import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

/**
 * tRPC client — import this in components to call procedures.
 *   const { data } = trpc.hello.useQuery({ name: "world" });
 */
export const trpc = createTRPCReact<AppRouter>();
