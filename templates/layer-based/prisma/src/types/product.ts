/**
 * Types layer: all shared TypeScript interfaces live here.
 * Domain-specific types that are only used in one service
 * can also live alongside that service file.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
}
