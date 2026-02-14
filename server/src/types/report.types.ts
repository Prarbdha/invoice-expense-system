export interface IProfitLossReport {
  period: {
    startDate: Date;
    endDate: Date;
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

export interface ITaxSummaryReport {
  period: {
    startDate: Date;
    endDate: Date;
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
}

export interface IClientReport {
  clientId: string;
  clientName: string;
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  averageInvoiceAmount: number;
  outstandingBalance: number;
}