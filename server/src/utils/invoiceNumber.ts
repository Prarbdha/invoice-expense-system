import prisma from '../config/database';

export const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Keep trying until we find a unique number
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Find the highest invoice number for this user and year
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        userId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc', // Order by invoice number, not creation date
      },
    });

    let nextNumber = 1;

    if (lastInvoice) {
      // Extract the sequence number from the last invoice
      // Format: INV-YYYY-NNNN
      try {
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length === 3) {
          const lastNumber = parseInt(parts[2], 10);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
      } catch (error) {
        console.error('Error parsing invoice number:', error);
        nextNumber = 1;
      }
    }

    // Format: INV-2024-0001
    const invoiceNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;
    
    // Check if this number already exists (double-check)
    const exists = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (!exists) {
      console.log('Generated unique invoice number:', invoiceNumber);
      return invoiceNumber;
    }

    console.log('Invoice number already exists, trying next number');
    attempts++;
  }

  // Fallback: use timestamp if we couldn't generate a unique number
  const timestamp = Date.now();
  const fallbackNumber = `${prefix}${String(timestamp).slice(-4)}`;
  console.warn('Using timestamp fallback invoice number:', fallbackNumber);
  return fallbackNumber;
};