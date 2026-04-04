import { ProductList } from "@/domain/product/components/ProductList";

/**
 * Domain-driven architecture:
 * Code is organized by business domain, not technical role.
 *   domain/product/   — all product-related code
 *   domain/user/      — all user-related code
 *   infrastructure/   — external concerns (HTTP, DB, cache)
 *   shared/           — truly cross-domain utilities
 *
 * Each domain owns: components, hooks, types, and services.
 * Infrastructure adapters are injected, not imported directly.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">{{projectName}}</h1>
      <ProductList />
    </main>
  );
}
