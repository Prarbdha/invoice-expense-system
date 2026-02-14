export interface IClient {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface IUpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}