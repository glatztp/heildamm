/**
 * Product domain types.
 * Types live inside the domain that owns them.
 * Only shared across domains when strictly necessary.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  description: string;
}
