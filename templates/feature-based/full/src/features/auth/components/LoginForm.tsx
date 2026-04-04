"use client";

/**
 * Auth feature owns all authentication UI.
 * LoginForm → features/auth/components/LoginForm.tsx
 * It only talks to hooks inside features/auth/hooks/.
 */
export function LoginForm() {
  return (
    <form className="flex flex-col gap-4 w-full max-w-sm">
      <h2 className="text-2xl font-semibold">Sign in</h2>
      <input
        type="email"
        placeholder="email@example.com"
        className="border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder="Password"
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800"
      >
        Sign in
      </button>
    </form>
  );
}
