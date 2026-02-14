import api from './api';
import type {  CreateCategoryDto } from '../types/expense.types';
import type { ExpenseCategory } from '../types/expense.types';

export const categoryService = {
  async getAll(): Promise<ExpenseCategory[]> {
    const response = await api.get<{ data: ExpenseCategory[] }>('/categories');
    return response.data.data;
  },

  async getById(id: string): Promise<ExpenseCategory> {
    const response = await api.get<{ data: ExpenseCategory }>(`/categories/${id}`);
    return response.data.data;
  },

  async create(data: CreateCategoryDto): Promise<ExpenseCategory> {
    const response = await api.post<{ data: ExpenseCategory }>('/categories', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<CreateCategoryDto>): Promise<ExpenseCategory> {
    const response = await api.put<{ data: ExpenseCategory }>(`/categories/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};