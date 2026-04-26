export interface Payment {
  id: number;
  orderId: number;
  table: string;
  amount: number;
  tipAmount?: number;
  cashAmount?: number;
  cardAmount?: number;
  qrAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  paidAt?: string | null;
}
