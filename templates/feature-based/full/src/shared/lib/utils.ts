/**
 * Shared utilities — functions used across multiple features.
 * Feature-specific utils stay inside their feature folder.
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
