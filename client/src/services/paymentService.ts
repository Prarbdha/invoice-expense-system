import api from './api';
import type { Payment, CreatePaymentDto } from '../types/payment.types';

export const paymentService = {
  async getByInvoice(invoiceId: string): Promise<Payment[]> {
    const response = await api.get<{ data: Payment[] }>(`/payments/invoice/${invoiceId}`);
    return response.data.data;
  },

  async record(invoiceId: string, data: CreatePaymentDto): Promise<Payment> {
    const response = await api.post<{ data: Payment }>(`/payments/invoice/${invoiceId}`, data);
    return response.data.data;
  },

  async update(id: string, data: Partial<CreatePaymentDto>): Promise<Payment> {
    const response = await api.put<{ data: Payment }>(`/payments/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  },
};