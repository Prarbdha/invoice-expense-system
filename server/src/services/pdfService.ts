import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  client: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string | null;
  user: {
    companyName?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
}

export const generateInvoicePDF = (invoice: InvoiceData): typeof PDFDocument => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Colors
  const primaryColor = '#2563eb'; // blue-600
  const grayColor = '#6b7280'; // gray-500

  // ============================================
  // HEADER SECTION
  // ============================================
  doc
    .fontSize(28)
    .fillColor(primaryColor)
    .text(invoice.user.companyName || 'Your Company', 50, 50);

  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text(invoice.user.email, 50, 85)
    .text(invoice.user.phone || '', 50, 100)
    .text(invoice.user.address || '', 50, 115);

  // Invoice Title and Number
  doc
    .fontSize(20)
    .fillColor('#000000')
    .text('INVOICE', 400, 50, { align: 'right' });

  doc
    .fontSize(12)
    .fillColor(grayColor)
    .text(invoice.invoiceNumber, 400, 75, { align: 'right' });

  // ============================================
  // DIVIDER LINE
  // ============================================
  doc
    .moveTo(50, 150)
    .lineTo(550, 150)
    .strokeColor('#e5e7eb')
    .stroke();

  // ============================================
  // BILL TO SECTION
  // ============================================
  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('BILL TO', 50, 170);

  doc
    .fontSize(12)
    .fillColor('#000000')
    .text(invoice.client.name, 50, 190)
    .fontSize(10)
    .fillColor(grayColor)
    .text(invoice.client.email, 50, 210)
    .text(invoice.client.phone || '', 50, 225)
    .text(invoice.client.address || '', 50, 240, { width: 250 });

  // ============================================
  // DATES SECTION
  // ============================================
  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('ISSUE DATE', 400, 170, { align: 'right' });

  doc
    .fontSize(12)
    .fillColor('#000000')
    .text(formatDate(invoice.issueDate), 400, 190, { align: 'right' });

  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('DUE DATE', 400, 215, { align: 'right' });

  doc
    .fontSize(12)
    .fillColor('#000000')
    .text(formatDate(invoice.dueDate), 400, 235, { align: 'right' });

  // ============================================
  // LINE ITEMS TABLE
  // ============================================
  const tableTop = 300;
  const tableHeaders = {
    description: 50,
    quantity: 350,
    unitPrice: 420,
    total: 490,
  };

  // Table Header
  doc
    .fontSize(10)
    .fillColor('#ffffff')
    .rect(50, tableTop, 500, 25)
    .fill(primaryColor);

  doc
    .fillColor('#ffffff')
    .text('DESCRIPTION', tableHeaders.description, tableTop + 8)
    .text('QTY', tableHeaders.quantity, tableTop + 8, { width: 50, align: 'right' })
    .text('UNIT PRICE', tableHeaders.unitPrice, tableTop + 8, {
      width: 60,
      align: 'right',
    })
    .text('TOTAL', tableHeaders.total, tableTop + 8, { width: 60, align: 'right' });

  // Table Rows
  let yPosition = tableTop + 35;
  doc.fillColor('#000000');

  invoice.items.forEach((item, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc
        .rect(50, yPosition - 5, 500, 25)
        .fillColor('#f9fafb')
        .fill();
    }

    doc
      .fontSize(10)
      .fillColor('#000000')
      .text(item.description, tableHeaders.description, yPosition, { width: 280 })
      .text(item.quantity.toString(), tableHeaders.quantity, yPosition, {
        width: 50,
        align: 'right',
      })
      .text(formatCurrency(item.unitPrice), tableHeaders.unitPrice, yPosition, {
        width: 60,
        align: 'right',
      })
      .text(formatCurrency(item.total), tableHeaders.total, yPosition, {
        width: 60,
        align: 'right',
      });

    yPosition += 30;

    // Add new page if needed
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
  });

  // ============================================
  // TOTALS SECTION
  // ============================================
  yPosition += 20;

  const totalsX = 380;

  // Subtotal
  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('Subtotal:', totalsX, yPosition)
    .fillColor('#000000')
    .text(formatCurrency(invoice.subtotal), totalsX + 110, yPosition, {
      align: 'right',
    });

  // Tax
  yPosition += 20;
  doc
    .fillColor(grayColor)
    .text(`Tax (${invoice.taxRate}%):`, totalsX, yPosition)
    .fillColor('#000000')
    .text(formatCurrency(invoice.taxAmount), totalsX + 110, yPosition, {
      align: 'right',
    });

  // Total
  yPosition += 25;
  doc
    .moveTo(totalsX, yPosition - 5)
    .lineTo(550, yPosition - 5)
    .strokeColor('#e5e7eb')
    .stroke();

  doc
    .fontSize(14)
    .fillColor('#000000')
    .text('Total:', totalsX, yPosition + 5)
    .fontSize(16)
    .fillColor(primaryColor)
    .text(formatCurrency(invoice.total), totalsX + 110, yPosition + 5, {
      align: 'right',
    });

  // ============================================
  // NOTES SECTION
  // ============================================
  if (invoice.notes) {
    yPosition += 60;

    // Add new page if needed
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    doc
      .fontSize(10)
      .fillColor(grayColor)
      .text('NOTES', 50, yPosition);

    doc
      .fontSize(10)
      .fillColor('#000000')
      .text(invoice.notes, 50, yPosition + 20, { width: 500 });
  }

  // ============================================
  // FOOTER (All Pages)
  // ============================================
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    doc
      .fontSize(8)
      .fillColor(grayColor)
      .text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: 500 }
      );

    doc
      .text(
        'Thank you for your business!',
        50,
        doc.page.height - 35,
        { align: 'center', width: 500 }
      );
  }

  return doc;
};

export const streamInvoicePDF = (invoice: InvoiceData, res: Response): void => {
  const doc = generateInvoicePDF(invoice);

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${invoice.invoiceNumber}.pdf`
  );

  // Stream the PDF to response
  doc.pipe(res);
  doc.end();
};