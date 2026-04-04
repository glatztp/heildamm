import type { User } from "@{{projectName}}/types";

/**
 * apps/api: standalone API server.
 * Shares types with apps/web via packages/types.
 * In production, deploy independently from the web app.
 */
const users: User[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com" },
];

// Minimal HTTP server for demonstration
const server = Bun.serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/users") {
      return Response.json(users);
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`API running on http://localhost:${server.port}`);
