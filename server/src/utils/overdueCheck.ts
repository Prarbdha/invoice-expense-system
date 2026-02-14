import prisma from '../config/database';
import { InvoiceStatus } from '@prisma/client';

export const updateOverdueInvoices = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find invoices that are SENT and past due date
    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.SENT,
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    console.log(`Updated ${overdueInvoices.count} overdue invoices`);
    return overdueInvoices.count;
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    return 0;
  }
};