/**
 * Feature-scoped hook. If this logic were needed across features,
 * it would move to `shared/lib/` or `shared/hooks/`.
 */
export function useGreeting(name: string): string {
  return `Hello, ${name}!`;
}
