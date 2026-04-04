import { Button } from "@{{projectName}}/ui";
import type { User } from "@{{projectName}}/types";

/**
 * Monorepo architecture:
 *   apps/web   — Next.js frontend
 *   apps/api   — standalone API server (or Next.js API routes)
 *   packages/ui      — shared design system
 *   packages/types   — shared TypeScript types
 *   packages/config  — shared tsconfig, eslint, tailwind configs
 *
 * Packages are installed as workspace dependencies.
 * Changes in packages/ui rebuild automatically in all apps.
 */
const mockUser: User = { id: "1", name: "Ada Lovelace", email: "ada@example.com" };

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-2">{{projectName}}</h1>
      <p className="text-gray-500 mb-8">Monorepo — apps/web</p>
      <p className="mb-4 text-sm text-gray-600">
        Logged in as <strong>{mockUser.name}</strong>
      </p>
      <Button>Get started</Button>
    </main>
  );
}
