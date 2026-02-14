import api from './api';
import type { Expense, UpdateExpenseDto } from '../types/expense.types';
import type { CreateExpenseDto } from '../types/expense.types';

export const expenseService = {
  async getAll(params?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    taxDeductible?: boolean;
  }): Promise<Expense[]> {
    const response = await api.get<{ data: Expense[] }>('/expenses', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<Expense> {
    const response = await api.get<{ data: Expense }>(`/expenses/${id}`);
    return response.data.data;
  },

  async create(data: CreateExpenseDto): Promise<Expense> {
    const formData = new FormData();
    formData.append('categoryId', data.categoryId);
    formData.append('amount', data.amount.toString());
    formData.append('date', data.date);
    if (data.description) formData.append('description', data.description);
    if (data.vendor) formData.append('vendor', data.vendor);
    formData.append('taxDeductible', data.taxDeductible ? 'true' : 'false');
    if (data.receipt) formData.append('receipt', data.receipt);

    const response = await api.post<{ data: Expense }>('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const formData = new FormData();
    if (data.categoryId) formData.append('categoryId', data.categoryId);
    if (data.amount !== undefined) formData.append('amount', data.amount.toString());
    if (data.date) formData.append('date', data.date);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.vendor !== undefined) formData.append('vendor', data.vendor);
    if (data.taxDeductible !== undefined) formData.append('taxDeductible', data.taxDeductible ? 'true' : 'false');
    if (data.receipt) formData.append('receipt', data.receipt);

    const response = await api.put<{ data: Expense }>(`/expenses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};