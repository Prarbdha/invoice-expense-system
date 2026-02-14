import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { clientService } from '../services/clientService';
import { invoiceService } from '../services/invoiceService';
import type { Client } from '../types/client.types';
import type { InvoiceItem, InvoiceStatus } from '../types/invoice.types';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState<number>(10);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  // Calculate line item total
  const calculateItemTotal = (quantity: number, unitPrice: number): number => {
    return Number((quantity * unitPrice).toFixed(2));
  };

  // Update item in array
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = calculateItemTotal(
        newItems[index].quantity,
        newItems[index].unitPrice
      );
    }

    setItems(newItems);
  };

  // Add new item
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Calculate subtotal
  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  // Calculate tax amount
  const calculateTaxAmount = (): number => {
    const subtotal = calculateSubtotal();
    return Number((subtotal * (taxRate / 100)).toFixed(2));
  };

  // Calculate total
  const calculateTotal = (): number => {
    return Number((calculateSubtotal() + calculateTaxAmount()).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    if (items.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please fill in all item details correctly');
      return;
    }

    setIsLoading(true);

    try {
      const invoiceData = {
        clientId: selectedClientId,
        issueDate,
        dueDate,
        taxRate,
        currency,
        notes: notes || undefined,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const invoice = await invoiceService.create(invoiceData);

      // If not draft, update status to SENT
      if (!asDraft) {
        await invoiceService.updateStatus(invoice.id, { status: 'SENT' as InvoiceStatus });
      }

      navigate('/invoices');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/invoices')}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Invoices
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Invoice</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form className="space-y-6">
        {/* Client and Date Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Invoice Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                id="client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date *
              </label>
              <input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Line Items - Will be completed in next step */}
        {/* Line Items */}
<div className="bg-white rounded-lg shadow p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-800">Line Items</h2>
    <button
      type="button"
      onClick={addItem}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Item
    </button>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">
            Description
          </th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-24">
            Qty
          </th>
          <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 w-32">
            Unit Price
          </th>
          <th className="text-right py-2 px-2 text-sm font-medium text-gray-700 w-32">
            Total
          </th>
          <th className="w-12"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="border-b">
            <td className="py-2 px-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Item description"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </td>
            <td className="py-2 px-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, 'quantity', Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </td>
            <td className="py-2 px-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(index, 'unitPrice', Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </td>
            <td className="py-2 px-2 text-right font-medium">
              ${item.total.toFixed(2)}
            </td>
            <td className="py-2 px-2">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
        
        {/* Totals and Submit - Will be completed in next step */}
        {/* Calculations and Notes */}
<div className="bg-white rounded-lg shadow p-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Notes */}
    <div>
      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
        Notes / Payment Terms
      </label>
      <textarea
        id="notes"
        rows={6}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Payment due within 30 days. Thank you for your business!"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* Totals */}
    <div>
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({taxRate}%):</span>
          <span className="font-medium">${calculateTaxAmount().toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="text-lg font-semibold text-gray-800">Total:</span>
          <span className="text-lg font-bold text-blue-600">
            ${calculateTotal().toFixed(2)} {currency}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 font-medium"
        >
          {isLoading ? 'Creating...' : 'Create & Send Invoice'}
        </button>

        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isLoading}
          className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 font-medium"
        >
          Save as Draft
        </button>

        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
      </form>
    </div>
  );
};

export default CreateInvoice;