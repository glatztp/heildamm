/**
 * Lib layer: pure utility functions with no side effects.
 * No state, no API calls — just helpers.
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}
