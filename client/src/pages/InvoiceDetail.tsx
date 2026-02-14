import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  
  DollarSign,
  X,
  Mail,
} from 'lucide-react';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { InvoiceStatus } from '../types/invoice.types';
import type { Invoice } from '../types/invoice.types';
import type{ Payment } from '../types/payment.types';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
      fetchPayments(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getById(invoiceId);
      setInvoice(data);
      setPaymentForm((prev) => ({ ...prev, amount: data.total.toString() }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async (invoiceId: string) => {
    try {
      const data = await paymentService.getByInvoice(invoiceId);
      setPayments(data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      await paymentService.record(invoice.id, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes || undefined,
      });

      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: '',
      });

      // Refresh invoice and payments
      fetchInvoice(invoice.id);
      fetchPayments(invoice.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to record payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      await paymentService.delete(paymentId);
      if (invoice) {
        fetchInvoice(invoice.id);
        fetchPayments(invoice.id);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  const handleMarkAsSent = async () => {
    if (!invoice) return;

    try {
      await invoiceService.updateStatus(invoice.id, {
        status: InvoiceStatus.SENT,
      });
      fetchInvoice(invoice.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update invoice');
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;

    if (!window.confirm(`Send invoice ${invoice.invoiceNumber} to ${invoice.client?.email}?`)) {
      return;
    }

    try {
      await invoiceService.sendEmail(invoice.id);
      alert('Invoice sent successfully!');
      fetchInvoice(invoice.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice');
    }
  };

  const handleSendReminder = async () => {
    if (!invoice) return;

    if (!window.confirm(`Send payment reminder to ${invoice.client?.email}?`)) {
      return;
    }

    try {
      await invoiceService.sendReminder(invoice.id);
      alert('Payment reminder sent successfully!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send reminder');
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await invoiceService.delete(invoice.id);
      navigate('/invoices');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const blob = await invoiceService.downloadPDF(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case InvoiceStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case InvoiceStatus.PAID:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case InvoiceStatus.CANCELLED:
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate payment totals
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remainingBalance = invoice ? Number(invoice.total) - totalPaid : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Invoice not found'}</div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/invoices')}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Invoices
      </button>

      {/* Header with Actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{invoice.invoiceNumber}</h1>
          <span
            className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
              invoice.status
            )}`}
          >
            {invoice.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {invoice.status === InvoiceStatus.DRAFT && (
            <>
              <button
                onClick={handleMarkAsSent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Mark as Sent
              </button>

              <button
                onClick={handleSendEmail}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </button>
            </>
          )}

          {(invoice.status === InvoiceStatus.SENT ||
            invoice.status === InvoiceStatus.OVERDUE) && (
            <>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </button>

              <button
                onClick={handleSendReminder}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Reminder
              </button>
            </>
          )}

          <button
            onClick={handleDownloadPDF}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>

          {invoice.status !== InvoiceStatus.PAID && (
            <>
              <Link
                to={`/invoices/edit/${invoice.id}`}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>

              <button
                onClick={handleDelete}
                className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payment Summary (if there are payments) */}
      {payments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalPaid, invoice.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Remaining Balance</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(remainingBalance, invoice.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Invoice Total</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(invoice.total, invoice.currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        {/* Header Section */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">BILL TO</h2>
            <p className="text-lg font-semibold text-gray-800">{invoice.client?.name}</p>
            <p className="text-gray-600">{invoice.client?.email}</p>
            {invoice.client?.phone && (
              <p className="text-gray-600">{invoice.client?.phone}</p>
            )}
            {invoice.client?.address && (
              <p className="text-gray-600 mt-2">{invoice.client?.address}</p>
            )}
          </div>

          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-500">Issue Date</p>
              <p className="text-gray-800 font-medium">{formatDate(invoice.issueDate)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-gray-800 font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.paymentDate && (
              <div>
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="text-green-600 font-medium">
                  {formatDate(invoice.paymentDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 w-24">
                  Qty
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 w-32">
                  Unit Price
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 w-32">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 text-gray-800">{item.description}</td>
                  <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="py-4 text-right font-medium text-gray-800">
                    {formatCurrency(item.total, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax ({invoice.taxRate}%):</span>
              <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t-2">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Method
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Notes
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {payment.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                      {formatCurrency(Number(payment.amount), invoice.currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={remainingBalance}
                    required
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Remaining balance: {formatCurrency(remainingBalance, invoice.currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  required
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional payment notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;