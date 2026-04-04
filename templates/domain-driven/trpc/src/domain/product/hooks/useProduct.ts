"use client";

import { useState, useEffect } from "react";
import type { Product } from "../types";

/**
 * Domain hook: encapsulates product domain state.
 * Calls infrastructure adapters, not raw fetch().
 */
export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json() as Promise<Product>)
      .then(setProduct)
      .finally(() => setIsLoading(false));
  }, [id]);

  return { product, isLoading };
}
