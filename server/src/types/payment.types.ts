export interface IPayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  notes?: string | null;
  createdAt: Date;
}

export interface ICreatePaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}