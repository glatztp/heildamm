import { Button } from "@/components/ui/Button";
import { useProducts } from "@/hooks/useProducts";

/**
 * Layer-based architecture:
 * Code is split by technical role (layer), not by feature.
 *   components/ — presentational
 *   hooks/       — state & side effects
 *   services/    — data fetching & external APIs
 *   types/       — shared TypeScript types
 *   lib/         — utilities & configuration
 */
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">{{projectName}}</h1>
      <p className="text-gray-500 mb-8">Layer-based architecture</p>
      <Button>Get started</Button>
    </main>
  );
}
