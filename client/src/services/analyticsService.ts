import api from './api';
import type {
  DashboardOverview,
  RevenueByMonth,
  ExpenseByCategory,
  TopClient,
  RecentActivity,
} from '../types/analytics.types';

export const analyticsService = {
  async getOverview(): Promise<DashboardOverview> {
    const response = await api.get<{ data: DashboardOverview }>('/analytics/overview');
    return response.data.data;
  },

  async getRevenueByMonth(months: number = 6): Promise<RevenueByMonth[]> {
    const response = await api.get<{ data: RevenueByMonth[] }>('/analytics/revenue-by-month', {
      params: { months },
    });
    return response.data.data;
  },

  async getExpensesByCategory(): Promise<ExpenseByCategory[]> {
    const response = await api.get<{ data: ExpenseByCategory[] }>('/analytics/expenses-by-category');
    return response.data.data;
  },

  async getTopClients(limit: number = 5): Promise<TopClient[]> {
    const response = await api.get<{ data: TopClient[] }>('/analytics/top-clients', {
      params: { limit },
    });
    return response.data.data;
  },

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await api.get<{ data: RecentActivity[] }>('/analytics/recent-activity', {
      params: { limit },
    });
    return response.data.data;
  },
};