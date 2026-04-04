"use client";

import { useState, useEffect } from "react";
import type { Product } from "../types";

/**
 * ProductList belongs to the product domain.
 * It composes domain hooks and domain types —
 * never imports from other domains directly.
 */
export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // In a real app: inject the productRepository from infrastructure/
    setProducts([
      { id: "1", name: "Sample Product", price: 99.9, stock: 10, description: "Demo" },
    ]);
  }, []);

  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map((p) => (
        <li key={p.id} className="border rounded-lg p-4 flex flex-col gap-2">
          <h2 className="font-semibold">{p.name}</h2>
          <p className="text-gray-500 text-sm">{p.description}</p>
          <span className="font-bold">R$ {p.price.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}
