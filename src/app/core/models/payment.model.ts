export interface Payment {
  id: number;
  orderId: number;
  table: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  paidAt?: string | null;
}