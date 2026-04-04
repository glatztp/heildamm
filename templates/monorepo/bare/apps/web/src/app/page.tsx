import { Button } from "@{{projectName}}/ui";

/**
 * Monorepo — bare variant.
 * UI components come from packages/ui (workspace dep).
 * Both apps share types from packages/types.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">{{projectName}}</h1>
      <p className="text-gray-500 mb-8">Monorepo — bare</p>
      <Button>Get started</Button>
    </main>
  );
}
