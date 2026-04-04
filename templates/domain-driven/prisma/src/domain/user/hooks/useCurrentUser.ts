"use client";

import { useState } from "react";
import type { User } from "../types";

/**
 * User domain hook.
 * User state stays inside the user domain boundary.
 * Other domains receive user data as props, not by importing this hook.
 */
export function useCurrentUser() {
  const [user] = useState<User | null>(null);
  return { user, isAuthenticated: user !== null };
}
