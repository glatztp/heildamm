import { HomeHero } from "@/features/home/components/HomeHero";

/**
 * Feature-based architecture:
 * Each feature owns its own components, hooks, and logic.
 * This page composes features — it doesn't own business logic.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <HomeHero />
    </main>
  );
}
