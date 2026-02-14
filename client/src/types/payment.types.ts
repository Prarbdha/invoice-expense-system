export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
}

export interface CreatePaymentDto {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}