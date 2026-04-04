import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

/**
 * packages/ui — shared design system.
 * This Button is consumed by apps/web and any future apps.
 * Keep this package framework-agnostic where possible.
 */
export function Button({ variant = "primary", children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-black hover:bg-gray-200",
  };
  return (
    <button
      className={`rounded px-4 py-2 font-medium transition-colors ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
