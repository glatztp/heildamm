/**
 * packages/types — shared TypeScript interfaces.
 * Both apps/web and apps/api import from here.
 * This prevents type drift between frontend and backend.
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  message?: string;
}
