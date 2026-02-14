import api from './api';
import type{
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  UpdateStatusDto,
  InvoiceStatus,
} from '../types/invoice.types';

export const invoiceService = {
  async getAll(params?: {
    status?: InvoiceStatus;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<Invoice[]> {
    const response = await api.get<{ data: Invoice[] }>('/invoices', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<Invoice> {
    const response = await api.get<{ data: Invoice }>(`/invoices/${id}`);
    return response.data.data;
  },

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const response = await api.post<{ data: Invoice }>('/invoices', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const response = await api.put<{ data: Invoice }>(`/invoices/${id}`, data);
    return response.data.data;
  },

  async updateStatus(id: string, data: UpdateStatusDto): Promise<Invoice> {
    const response = await api.patch<{ data: Invoice }>(`/invoices/${id}/status`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  async downloadPDF(id: string): Promise<Blob> {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async sendEmail(id: string): Promise<void> {
    await api.post(`/invoices/${id}/send`);
  },

  async sendReminder(id: string): Promise<void> {
    await api.post(`/invoices/${id}/remind`);
  },
};