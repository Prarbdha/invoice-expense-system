export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export const calculateInvoiceTotals = (
  items: { quantity: number; unitPrice: number }[],
  taxRate: number
): InvoiceCalculations => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // Calculate tax amount
  const taxAmount = (subtotal * taxRate) / 100;

  // Calculate total
  const total = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

export const calculateLineItemTotal = (quantity: number, unitPrice: number): number => {
  return Number((quantity * unitPrice).toFixed(2));
};