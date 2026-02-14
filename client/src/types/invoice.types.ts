export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  paymentDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
  items?: InvoiceItem[];
}

export interface CreateInvoiceDto {
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  currency?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceDto {
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  currency?: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateStatusDto {
  status: InvoiceStatus;
  paymentDate?: string;
}