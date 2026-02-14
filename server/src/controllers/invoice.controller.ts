import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { generateInvoiceNumber } from '../utils/invoiceNumber';
import { calculateInvoiceTotals, calculateLineItemTotal } from '../utils/calculations';
import { ICreateInvoiceRequest } from '../types/invoice.types';
import { InvoiceStatus } from '@prisma/client';
import { updateOverdueInvoices } from '../utils/overdueCheck';
import  { streamInvoicePDF } from '../services/pdfService';
import {
  sendEmail,
  invoiceEmailTemplate,
  paymentReminderTemplate,
} from '../services/emailService';
import { generateInvoicePDF } from '../services/pdfService';
import PDFDocument from 'pdfkit';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { status, clientId, startDate, endDate, search } = req.query;

    // Check and update overdue invoices
    await updateOverdueInvoices();

    let where: any = { userId };


    // Filter by status
    if (status && typeof status === 'string') {
      where.status = status as InvoiceStatus;
    }

    // Filter by client
    if (clientId && typeof clientId === 'string') {
      where.clientId = clientId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate as string);
      }
    }

    // Search by invoice number
    if (search && typeof search === 'string') {
      where.invoiceNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    sendSuccess(res, 200, 'Invoices fetched successfully', invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    sendError(res, 500, 'Error fetching invoices', error);
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    sendSuccess(res, 200, 'Invoice fetched successfully', invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    sendError(res, 500, 'Error fetching invoice', error);
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      clientId,
      issueDate,
      dueDate,
      taxRate,
      currency = 'USD',
      notes,
      items,
    }: ICreateInvoiceRequest = req.body;

    // Validation
    if (!clientId || !issueDate || !dueDate || taxRate === undefined || !items || items.length === 0) {
      return sendError(res, 400, 'Missing required fields');
    }

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) {
      return sendError(res, 404, 'Client not found');
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(userId);

    // Calculate totals
    const calculations = calculateInvoiceTotals(items, taxRate);

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          userId,
          clientId,
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          subtotal: calculations.subtotal,
          taxRate,
          taxAmount: calculations.taxAmount,
          total: calculations.total,
          currency,
          status: InvoiceStatus.DRAFT,
          notes: notes || null,
        },
      });

      // Create invoice items
      const itemsData = items.map((item) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: calculateLineItemTotal(item.quantity, item.unitPrice),
      }));

      await tx.invoiceItem.createMany({
        data: itemsData,
      });

      // Fetch complete invoice with items
      return await tx.invoice.findUnique({
        where: { id: newInvoice.id },
        include: {
          client: true,
          items: true,
        },
      });
    });

    sendSuccess(res, 201, 'Invoice created successfully', invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    sendError(res, 500, 'Error creating invoice', error);
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const {
      clientId,
      issueDate,
      dueDate,
      taxRate,
      currency,
      notes,
      items,
    } = req.body;

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingInvoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Can't edit paid invoices
    if (existingInvoice.status === InvoiceStatus.PAID) {
      return sendError(res, 400, 'Cannot edit paid invoices');
    }

    // If client is being updated, verify it exists
    if (clientId && clientId !== existingInvoice.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId,
        },
      });

      if (!client) {
        return sendError(res, 404, 'Client not found');
      }
    }

    // Calculate new totals if items are provided
    let calculations = null;
    if (items && items.length > 0) {
      const taxRateToUse = taxRate !== undefined ? taxRate : existingInvoice.taxRate;
      calculations = calculateInvoiceTotals(items, Number(taxRateToUse));
    }

    // Update invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {};
      if (clientId) updateData.clientId = clientId;
      if (issueDate) updateData.issueDate = new Date(issueDate);
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (taxRate !== undefined) updateData.taxRate = taxRate;
      if (currency) updateData.currency = currency;
      if (notes !== undefined) updateData.notes = notes || null;

      if (calculations) {
        updateData.subtotal = calculations.subtotal;
        updateData.taxAmount = calculations.taxAmount;
        updateData.total = calculations.total;
      }

      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (items && items.length > 0) {
        // Delete existing items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Create new items
        const itemsData = items.map((item: any) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: calculateLineItemTotal(item.quantity, item.unitPrice),
        }));

        await tx.invoiceItem.createMany({
          data: itemsData,
        });
      }

      // Fetch complete invoice
      return await tx.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          items: true,
        },
      });
    });

    sendSuccess(res, 200, 'Invoice updated successfully', invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    sendError(res, 500, 'Error updating invoice', error);
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingInvoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Can't delete paid invoices
    if (existingInvoice.status === InvoiceStatus.PAID) {
      return sendError(res, 400, 'Cannot delete paid invoices');
    }

    // Delete invoice (items will be deleted automatically due to cascade)
    await prisma.invoice.delete({
      where: { id },
    });

    sendSuccess(res, 200, 'Invoice deleted successfully', null);
  } catch (error) {
    console.error('Delete invoice error:', error);
    sendError(res, 500, 'Error deleting invoice', error);
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { status, paymentDate } = req.body;

    if (!status) {
      return sendError(res, 400, 'Status is required');
    }

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingInvoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Prepare update data
    const updateData: any = { status };

    if (status === InvoiceStatus.PAID) {
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    } else if (status !== InvoiceStatus.PAID) {
      updateData.paymentDate = null;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true,
      },
    });

    sendSuccess(res, 200, 'Invoice status updated successfully', invoice);
//   } catch (error) {
//     console.error('Update invoice status error:', error);
//     sendError(res, 500, 'Error updating invoice status', error);
//   }
// };
} catch (error) {
    console.error('Get invoices error:', error);
    sendError(res, 500, 'Error fetching invoices', error);
  }
};


export const downloadInvoicePDF = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        items: true,
        user: true,
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Prepare data for PDF
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      currency: invoice.currency,
      notes: invoice.notes,
      user: {
        companyName: invoice.user.companyName,
        email: invoice.user.email,
        phone: invoice.user.phone,
        address: invoice.user.address,
      },
    };

    streamInvoicePDF(pdfData, res);
  } catch (error) {
    console.error('Download PDF error:', error);
    sendError(res, 500, 'Error generating PDF', error);
  }
};



export const sendInvoiceEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        items: true,
        user: true,
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    // Generate PDF
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      currency: invoice.currency,
      notes: invoice.notes,
      user: {
        companyName: invoice.user.companyName,
        email: invoice.user.email,
        phone: invoice.user.phone,
        address: invoice.user.address,
      },
    };

    const pdfDoc = generateInvoicePDF(pdfData);

    // Convert PDF to buffer
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      pdfDoc.on('end', resolve);
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Format data for email
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(Number(invoice.total));

    const dueDate = invoice.dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send email
    const emailSent = await sendEmail({
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.user.companyName || 'Invoice Pro'}`,
      html: invoiceEmailTemplate(
        invoice.invoiceNumber,
        invoice.client.name,
        amount,
        dueDate,
        invoice.user.companyName || 'Invoice Pro'
      ),
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (!emailSent) {
      return sendError(res, 500, 'Failed to send email');
    }

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === InvoiceStatus.DRAFT) {
      await prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.SENT },
      });
    }

    sendSuccess(res, 200, 'Invoice sent successfully', null);
  } catch (error) {
    console.error('Send invoice email error:', error);
    sendError(res, 500, 'Error sending invoice email', error);
  }
};

export const sendPaymentReminder = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        user: true,
      },
    });

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return sendError(res, 400, 'Invoice is already paid');
    }

    // Calculate days overdue
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(Number(invoice.total));

    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send reminder email
    const emailSent = await sendEmail({
      to: invoice.client.email,
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
      html: paymentReminderTemplate(
        invoice.invoiceNumber,
        invoice.client.name,
        amount,
        dueDateStr,
        Math.max(0, daysOverdue),
        invoice.user.companyName || 'Invoice Pro'
      ),
    });

    if (!emailSent) {
      return sendError(res, 500, 'Failed to send reminder email');
    }

    sendSuccess(res, 200, 'Payment reminder sent successfully', null);
  } catch (error) {
    console.error('Send payment reminder error:', error);
    sendError(res, 500, 'Error sending payment reminder', error);
  }
};