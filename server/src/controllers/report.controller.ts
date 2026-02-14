import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { InvoiceStatus } from '@prisma/client';

export const getProfitLossReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 400, 'Start date and end date are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get revenue (paid invoices)
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.PAID,
        paymentDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        client: true,
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Revenue by client
    const clientRevenue = new Map<string, number>();
    invoices.forEach((inv) => {
      const current = clientRevenue.get(inv.client.name) || 0;
      clientRevenue.set(inv.client.name, current + Number(inv.total));
    });

    const revenueByClient = Array.from(clientRevenue.entries())
      .map(([clientName, amount]) => ({ clientName, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        category: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Expenses by category
    const categoryExpenses = new Map<string, number>();
    expenses.forEach((exp) => {
      const current = categoryExpenses.get(exp.category.name) || 0;
      categoryExpenses.set(exp.category.name, current + Number(exp.amount));
    });

    const expensesByCategory = Array.from(categoryExpenses.entries())
      .map(([categoryName, amount]) => ({ categoryName, amount }))
      .sort((a, b) => b.amount - a.amount);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const report = {
      period: {
        startDate: start,
        endDate: end,
      },
      revenue: {
        total: totalRevenue,
        byClient: revenueByClient,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      netProfit,
      profitMargin: Number(profitMargin.toFixed(2)),
    };

    sendSuccess(res, 200, 'Profit & Loss report generated successfully', report);
  } catch (error) {
    console.error('Get P&L report error:', error);
    sendError(res, 500, 'Error generating P&L report', error);
  }
};

export const getTaxSummaryReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate, taxRate = 25 } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 400, 'Start date and end date are required');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get total revenue
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.PAID,
        paymentDate: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // Get tax-deductible expenses
    const deductibleExpenses = await prisma.expense.findMany({
      where: {
        userId,
        taxDeductible: true,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        category: true,
      },
    });

    const totalDeductions = deductibleExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    // Deductions by category
    const categoryDeductions = new Map<string, number>();
    deductibleExpenses.forEach((exp) => {
      const current = categoryDeductions.get(exp.category.name) || 0;
      categoryDeductions.set(exp.category.name, current + Number(exp.amount));
    });

    const deductionsByCategory = Array.from(categoryDeductions.entries())
      .map(([categoryName, amount]) => ({ categoryName, amount }))
      .sort((a, b) => b.amount - a.amount);

    const taxableIncome = totalRevenue - totalDeductions;
    const estimatedTaxLiability = (taxableIncome * Number(taxRate)) / 100;

    const report = {
      period: {
        startDate: start,
        endDate: end,
      },
      totalRevenue,
      taxableIncome,
      deductions: {
        total: totalDeductions,
        byCategory: deductionsByCategory,
      },
      estimatedTaxLiability,
      taxRate: Number(taxRate),
    };

    sendSuccess(res, 200, 'Tax summary report generated successfully', report);
  } catch (error) {
    console.error('Get tax summary report error:', error);
    sendError(res, 500, 'Error generating tax summary report', error);
  }
};

export const getClientReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        invoices: {
          include: {
            payments: true,
          },
        },
      },
    });

    const clientReports = clients.map((client) => {
      const totalInvoices = client.invoices.length;
      const paidInvoices = client.invoices.filter(
        (inv) => inv.status === InvoiceStatus.PAID
      ).length;
      const unpaidInvoices = totalInvoices - paidInvoices;

      const totalRevenue = client.invoices
        .filter((inv) => inv.status === InvoiceStatus.PAID)
        .reduce((sum, inv) => sum + Number(inv.total), 0);

      const averageInvoiceAmount = totalInvoices > 0 ? totalRevenue / paidInvoices || 0 : 0;

      // Calculate outstanding balance
      const outstandingBalance = client.invoices
        .filter((inv) => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE)
        .reduce((sum, inv) => {
          const paid = inv.payments.reduce((p, payment) => p + Number(payment.amount), 0);
          return sum + (Number(inv.total) - paid);
        }, 0);

      return {
        clientId: client.id,
        clientName: client.name,
        totalInvoices,
        totalRevenue,
        paidInvoices,
        unpaidInvoices,
        averageInvoiceAmount,
        outstandingBalance,
      };
    });

    // Sort by total revenue descending
    clientReports.sort((a, b) => b.totalRevenue - a.totalRevenue);

    sendSuccess(res, 200, 'Client report generated successfully', clientReports);
  } catch (error) {
    console.error('Get client report error:', error);
    sendError(res, 500, 'Error generating client report', error);
  }
};

export const exportToCSV = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { type, startDate, endDate } = req.query;

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where: {
          userId,
          ...(startDate && endDate
            ? {
                issueDate: {
                  gte: new Date(startDate as string),
                  lte: new Date(endDate as string),
                },
              }
            : {}),
        },
        include: {
          client: true,
        },
        orderBy: { issueDate: 'desc' },
      });

      // Generate CSV
      const csvRows = [
        'Invoice Number,Client,Issue Date,Due Date,Amount,Status,Payment Date',
      ];

      invoices.forEach((inv) => {
        csvRows.push(
          `${inv.invoiceNumber},${inv.client.name},${inv.issueDate.toISOString().split('T')[0]},${inv.dueDate.toISOString().split('T')[0]},${inv.total},${inv.status},${inv.paymentDate ? inv.paymentDate.toISOString().split('T')[0] : ''}`
        );
      });

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
      res.send(csv);
    } else if (type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          ...(startDate && endDate
            ? {
                date: {
                  gte: new Date(startDate as string),
                  lte: new Date(endDate as string),
                },
              }
            : {}),
        },
        include: {
          category: true,
        },
        orderBy: { date: 'desc' },
      });

      const csvRows = [
        'Date,Category,Amount,Vendor,Description,Tax Deductible',
      ];

      expenses.forEach((exp) => {
        csvRows.push(
          `${exp.date.toISOString().split('T')[0]},${exp.category.name},${exp.amount},${exp.vendor || ''},${exp.description || ''},${exp.taxDeductible}`
        );
      });

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
      res.send(csv);
    } else {
      return sendError(res, 400, 'Invalid export type');
    }
  } catch (error) {
    console.error('Export to CSV error:', error);
    sendError(res, 500, 'Error exporting to CSV', error);
  }
};