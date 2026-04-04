import type { ButtonHTMLAttributes } from "react";

/**
 * Shared UI: purely presentational, no domain logic.
 * If a UI component needs domain data, it should live in the domain.
 */
export function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="rounded px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}
