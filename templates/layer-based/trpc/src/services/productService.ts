import type { Product } from "@/types/product";

/**
 * Services layer: owns all data access logic.
 * Components and hooks never fetch directly — they call services.
 * This makes it trivial to swap REST for tRPC or GraphQL later.
 */
export const productService = {
  async getAll(): Promise<Product[]> {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json() as Promise<Product[]>;
  },

  async getById(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error(`Product ${id} not found`);
    return res.json() as Promise<Product>;
  },
};
