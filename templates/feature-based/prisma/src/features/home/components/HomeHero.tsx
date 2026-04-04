import { useGreeting } from "../hooks/useGreeting";

/**
 * HomeHero lives inside `features/home/` because it belongs
 * exclusively to the home feature. When this feature grows,
 * its components, hooks, and types stay co-located here.
 */
export function HomeHero() {
  const greeting = useGreeting("world");
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-4xl font-bold">{greeting}</h1>
      <p className="text-gray-500">Feature-based architecture — {{projectName}}</p>
    </section>
  );
}
