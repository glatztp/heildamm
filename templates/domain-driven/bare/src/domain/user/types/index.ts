export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: Date;
}
