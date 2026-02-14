export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}