import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/**
 * All UI components live in components/ui/ regardless of domain.
 * This is the layer-based trade-off: easy to find by type,
 * harder to co-locate with business logic.
 */
export function Button({ variant = "primary", children, ...props }: ButtonProps) {
  const base = "rounded px-4 py-2 font-medium transition-colors";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-black hover:bg-gray-200",
  };
  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}
