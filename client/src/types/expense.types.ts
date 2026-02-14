export interface ExpenseCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  color?: string;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  date: string;
  description?: string | null;
  receiptUrl?: string | null;
  vendor?: string | null;
  taxDeductible: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory;
}

export interface CreateExpenseDto {
  categoryId: string;
  amount: number;
  date: string;
  description?: string;
  vendor?: string;
  taxDeductible?: boolean;
  receipt?: File;
}

export interface UpdateExpenseDto {
  categoryId?: string;
  amount?: number;
  date?: string;
  description?: string;
  vendor?: string;
  taxDeductible?: boolean;
  receipt?: File;
}