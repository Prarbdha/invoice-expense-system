import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { InvoiceStatus } from '@prisma/client';

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all paid invoices for revenue
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.PAID,
      },
      select: {
        total: true,
      },
    });

    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: {
        amount: true,
        date: true,
      },
    });

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    const profit = totalRevenue - totalExpenses;

    // Get outstanding amount (sent + overdue invoices)
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
      },
      select: {
        total: true,
        payments: {
          select: {
            amount: true,
          },
        },
      },
    });

    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((p, payment) => p + Number(payment.amount), 0);
      return sum + (Number(inv.total) - paid);
    }, 0);

    // Invoice statistics
    const allInvoices = await prisma.invoice.findMany({
      where: { userId },
      select: { status: true },
    });

    const invoiceStats = {
      total: allInvoices.length,
      draft: allInvoices.filter((i) => i.status === InvoiceStatus.DRAFT).length,
      sent: allInvoices.filter((i) => i.status === InvoiceStatus.SENT).length,
      paid: allInvoices.filter((i) => i.status === InvoiceStatus.PAID).length,
      overdue: allInvoices.filter((i) => i.status === InvoiceStatus.OVERDUE).length,
    };

    // Expense statistics
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = expenses.filter(
      (e) => new Date(e.date) >= thisMonthStart
    );

    const lastMonthExpenses = expenses.filter(
      (e) => new Date(e.date) >= lastMonthStart && new Date(e.date) <= lastMonthEnd
    );

    const expenseStats = {
      total: expenses.length,
      thisMonth: thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      lastMonth: lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    };

    const overview = {
      totalRevenue,
      totalExpenses,
      profit,
      outstandingAmount,
      invoiceStats,
      expenseStats,
    };

    sendSuccess(res, 200, 'Dashboard overview fetched successfully', overview);
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    sendError(res, 500, 'Error fetching dashboard overview', error);
  }
};

export const getRevenueByMonth = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { months = 6 } = req.query;

    const monthsCount = Number(months);
    const data: any[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get revenue (paid invoices)
      const invoices = await prisma.invoice.findMany({
        where: {
          userId,
          status: InvoiceStatus.PAID,
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: {
          total: true,
        },
      });

      const revenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      // Get expenses
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: {
          amount: true,
        },
      });

      const expenseTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
      });
    }

    sendSuccess(res, 200, 'Revenue by month fetched successfully', data);
  } catch (error) {
    console.error('Get revenue by month error:', error);
    sendError(res, 500, 'Error fetching revenue by month', error);
  }
};

export const getExpensesByCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });

    const categoryTotals = new Map<string, { amount: number; color: string }>();

    expenses.forEach((expense) => {
      const categoryName = expense.category.name;
      const current = categoryTotals.get(categoryName) || { amount: 0, color: expense.category.color };
      current.amount += Number(expense.amount);
      categoryTotals.set(categoryName, current);
    });

    const total = Array.from(categoryTotals.values()).reduce((sum, cat) => sum + cat.amount, 0);

    const data = Array.from(categoryTotals.entries()).map(([category, { amount, color }]) => ({
      category,
      amount,
      percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      color,
    }));

    // Sort by amount descending
    data.sort((a, b) => b.amount - a.amount);

    sendSuccess(res, 200, 'Expenses by category fetched successfully', data);
  } catch (error) {
    console.error('Get expenses by category error:', error);
    sendError(res, 500, 'Error fetching expenses by category', error);
  }
};

export const getTopClients = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit = 5 } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.PAID,
      },
      include: {
        client: true,
      },
    });

    const clientTotals = new Map<string, { name: string; revenue: number; count: number }>();

    invoices.forEach((invoice) => {
      const clientId = invoice.clientId;
      const current = clientTotals.get(clientId) || {
        name: invoice.client.name,
        revenue: 0,
        count: 0,
      };
      current.revenue += Number(invoice.total);
      current.count += 1;
      clientTotals.set(clientId, current);
    });

    const data = Array.from(clientTotals.entries())
      .map(([id, { name, revenue, count }]) => ({
        id,
        name,
        totalRevenue: revenue,
        invoiceCount: count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, Number(limit));

    sendSuccess(res, 200, 'Top clients fetched successfully', data);
  } catch (error) {
    console.error('Get top clients error:', error);
    sendError(res, 500, 'Error fetching top clients', error);
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit = 10 } = req.query;

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        invoice: { userId },
      },
      include: {
        invoice: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    // Combine and format activities
    const activities: any[] = [
      ...recentInvoices.map((inv) => ({
        type: 'invoice',
        id: inv.id,
        description: `Invoice ${inv.invoiceNumber} for ${inv.client.name}`,
        amount: Number(inv.total),
        date: inv.createdAt,
      })),
      ...recentExpenses.map((exp) => ({
        type: 'expense',
        id: exp.id,
        description: `${exp.category.name} expense${exp.vendor ? ` - ${exp.vendor}` : ''}`,
        amount: Number(exp.amount),
        date: exp.createdAt,
      })),
      ...recentPayments.map((pay) => ({
        type: 'payment',
        id: pay.id,
        description: `Payment received for ${pay.invoice.invoiceNumber}`,
        amount: Number(pay.amount),
        date: pay.createdAt,
      })),
    ];

    // Sort by date descending and limit
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    const limitedActivities = activities.slice(0, Number(limit));

    sendSuccess(res, 200, 'Recent activity fetched successfully', limitedActivities);
  } catch (error) {
    console.error('Get recent activity error:', error);
    sendError(res, 500, 'Error fetching recent activity', error);
  }
};