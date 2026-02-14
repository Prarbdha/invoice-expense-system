import api from './api';
import type { Client, CreateClientDto, UpdateClientDto } from '../types/client.types';

export const clientService = {
  async getAll(search?: string): Promise<Client[]> {
    const params = search ? { search } : {};
    const response = await api.get<{ data: Client[] }>('/clients', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get<{ data: Client }>(`/clients/${id}`);
    return response.data.data;
  },

  async create(data: CreateClientDto): Promise<Client> {
    const response = await api.post<{ data: Client }>('/clients', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await api.put<{ data: Client }>(`/clients/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};