import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { ICreatePaymentRequest } from '../types/payment.types';
import { Prisma, InvoiceStatus } from '@prisma/client';

export const getPaymentsByInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { invoiceId } = req.params;

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });

    sendSuccess(res, 200, 'Payments fetched successfully', payments);
  } catch (error) {
    console.error('Get payments error:', error);
    sendError(res, 500, 'Error fetching payments', error);
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { invoiceId } = req.params;
    const {
      amount,
      paymentDate,
      paymentMethod,
      notes,
    }: ICreatePaymentRequest = req.body;

    // Validation
    if (!amount || !paymentDate || !paymentMethod) {
      return sendError(res, 400, 'Amount, payment date, and payment method are required');
    }

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Calculate total paid
    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const newTotalPaid = totalPaid + Number(amount);
    const invoiceTotal = Number(invoice.total);

    // Validate payment amount
    if (newTotalPaid > invoiceTotal) {
      return sendError(
        res,
        400,
        `Payment amount exceeds remaining balance. Remaining: $${(invoiceTotal - totalPaid).toFixed(2)}`
      );
    }

    // Create payment and update invoice status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: new Prisma.Decimal(amount),
          paymentDate: new Date(paymentDate),
          paymentMethod,
          notes: notes || null,
        },
      });

      // Update invoice status
      const updateData: any = {};

      if (newTotalPaid >= invoiceTotal) {
        // Fully paid
        updateData.status = InvoiceStatus.PAID;
        updateData.paymentDate = new Date(paymentDate);
      } else if (invoice.status === InvoiceStatus.DRAFT) {
        // Partial payment, update to SENT if it was DRAFT
        updateData.status = InvoiceStatus.SENT;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: updateData,
        });
      }

      return payment;
    });

    sendSuccess(res, 201, 'Payment recorded successfully', result);
  } catch (error) {
    console.error('Record payment error:', error);
    sendError(res, 500, 'Error recording payment', error);
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, notes } = req.body;

    // Find payment and verify access
    const existingPayment = await prisma.payment.findFirst({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!existingPayment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (existingPayment.invoice.userId !== userId) {
      return sendError(res, 403, 'Access denied');
    }

    // Prepare update data
    const updateData: any = {};
    if (amount !== undefined) updateData.amount = new Prisma.Decimal(amount);
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes || null;

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, 200, 'Payment updated successfully', payment);
  } catch (error) {
    console.error('Update payment error:', error);
    sendError(res, 500, 'Error updating payment', error);
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Find payment and verify access
    const existingPayment = await prisma.payment.findFirst({
      where: { id },
      include: {
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!existingPayment) {
      return sendError(res, 404, 'Payment not found');
    }

    if (existingPayment.invoice.userId !== userId) {
      return sendError(res, 403, 'Access denied');
    }

    // Delete payment and update invoice status in transaction
    await prisma.$transaction(async (tx) => {
      // Delete payment
      await tx.payment.delete({
        where: { id },
      });

      // Recalculate total paid (excluding the deleted payment)
      const remainingPayments = existingPayment.invoice.payments.filter(
        (p) => p.id !== id
      );

      const totalPaid = remainingPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const invoiceTotal = Number(existingPayment.invoice.total);

      // Update invoice status
      let newStatus = existingPayment.invoice.status;
      let paymentDate = existingPayment.invoice.paymentDate;

      if (totalPaid === 0) {
        // No payments, revert to SENT or OVERDUE
        const dueDate = new Date(existingPayment.invoice.dueDate);
        const today = new Date();
        newStatus = dueDate < today ? InvoiceStatus.OVERDUE : InvoiceStatus.SENT;
        paymentDate = null;
      } else if (totalPaid < invoiceTotal && existingPayment.invoice.status === InvoiceStatus.PAID) {
        // Partial payment, no longer fully paid
        newStatus = InvoiceStatus.SENT;
        paymentDate = null;
      }

      await tx.invoice.update({
        where: { id: existingPayment.invoiceId },
        data: {
          status: newStatus,
          paymentDate: paymentDate,
        },
      });
    });

    sendSuccess(res, 200, 'Payment deleted successfully', null);
  } catch (error) {
    console.error('Delete payment error:', error);
    sendError(res, 500, 'Error deleting payment', error);
  }
};