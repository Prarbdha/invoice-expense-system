import api from './api';
import type { ProfitLossReport, TaxSummaryReport } from '../types/report.types';
import type { ClientReport } from '../types/report.types';

export const reportService = {
  async getProfitLoss(startDate: string, endDate: string): Promise<ProfitLossReport> {
    const response = await api.get<{ data: ProfitLossReport }>('/reports/profit-loss', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getTaxSummary(
    startDate: string,
    endDate: string,
    taxRate?: number
  ): Promise<TaxSummaryReport> {
    const response = await api.get<{ data: TaxSummaryReport }>('/reports/tax-summary', {
      params: { startDate, endDate, taxRate },
    });
    return response.data.data;
  },

  async getClientReport(): Promise<ClientReport[]> {
    const response = await api.get<{ data: ClientReport[] }>('/reports/clients');
    return response.data.data;
  },

  async exportToCSV(
    type: 'invoices' | 'expenses',
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const response = await api.get('/reports/export', {
      params: { type, startDate, endDate },
      responseType: 'blob',
    });
    return response.data;
  },
};