export interface IExpenseCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ICreateCategoryRequest {
  name: string;
  color?: string;
}

export interface IExpense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  date: Date;
  description?: string | null;
  receiptUrl?: string | null;
  vendor?: string | null;
  taxDeductible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateExpenseRequest {
  categoryId: string;
  amount: number;
  date: string;
  description?: string;
  vendor?: string;
  taxDeductible?: boolean;
}