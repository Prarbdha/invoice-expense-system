export interface DashboardOverview {
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

export interface RevenueByMonth {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TopClient {
  id: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface RecentActivity {
  type: 'invoice' | 'expense' | 'payment';
  id: string;
  description: string;
  amount: number;
  date: string;
}