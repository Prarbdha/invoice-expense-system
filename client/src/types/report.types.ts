export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    byClient: Array<{
      clientName: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    byCategory: Array<{
      categoryName: string;
      amount: number;
    }>;
  };
  netProfit: number;
  profitMargin: number;
}

export interface TaxSummaryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  taxableIncome: number;
  deductions: {
    total: number;
    byCategory: Array<{
      categoryName: string;
      amount: number;
    }>;
  };
  estimatedTaxLiability: number;
  taxRate: number;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  averageInvoiceAmount: number;
  outstandingBalance: number;
}