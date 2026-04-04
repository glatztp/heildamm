"use client";

import { useState } from "react";

/**
 * Auth hook scoped to the auth feature.
 * Handles local state for authentication flow.
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function login() {
    setIsAuthenticated(true);
  }

  function logout() {
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
