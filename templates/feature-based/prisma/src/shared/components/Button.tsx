import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/**
 * Shared components are feature-agnostic.
 * If a component is used by 2+ features, it belongs here.
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
