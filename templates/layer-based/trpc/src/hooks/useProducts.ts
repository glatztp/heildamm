"use client";

import { useState, useEffect } from "react";
import { productService } from "@/services/productService";
import type { Product } from "@/types/product";

/**
 * Hooks layer: manages state and orchestrates services.
 * Never calls APIs directly — delegates to services/.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    productService
      .getAll()
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { products, isLoading, error };
}
