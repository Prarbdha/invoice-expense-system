export interface IInvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  paymentDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: IInvoiceItem[];
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface ICreateInvoiceRequest {
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

export interface IUpdateInvoiceRequest {
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