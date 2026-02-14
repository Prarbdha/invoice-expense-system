export interface IDashboardOverview {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  outstandingAmount: number;
  invoiceStats: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
  expenseStats: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export interface IRevenueByMonth {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface IExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ITopClient {
  id: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface IRecentActivity {
  type: 'invoice' | 'expense' | 'payment';
  id: string;
  description: string;
  amount: number;
  date: Date;
}