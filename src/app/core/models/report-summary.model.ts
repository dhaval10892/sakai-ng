export interface ReportSummary {
  totalOrders: number;
  activeTables: number;
  paidRevenue: number;
  unpaidServedOrders: number;
  totalPayments: number;
  cashPayments: number;
  cardPayments: number;
  qrPayments: number;
}