import React, { useState } from 'react';
import { FileText, Download, TrendingUp, DollarSign, Users } from 'lucide-react';
import { reportService } from '../services/reportService';
import type { ProfitLossReport, TaxSummaryReport, ClientReport } from '../types/report.types';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profit-loss' | 'tax' | 'clients'>('profit-loss');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(25);

  const [profitLossReport, setProfitLossReport] = useState<ProfitLossReport | null>(null);
  const [taxReport, setTaxReport] = useState<TaxSummaryReport | null>(null);
  const [clientReport, setClientReport] = useState<ClientReport[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const generateProfitLossReport = async () => {
    try {
      setIsLoading(true);
      setError('');
      const report = await reportService.getProfitLoss(startDate, endDate);
      setProfitLossReport(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTaxReport = async () => {
    try {
      setIsLoading(true);
      setError('');
      const report = await reportService.getTaxSummary(startDate, endDate, taxRate);
      setTaxReport(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const generateClientReport = async () => {
    try {
      setIsLoading(true);
      setError('');
      const report = await reportService.getClientReport();
      setClientReport(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: 'invoices' | 'expenses') => {
    try {
      const blob = await reportService.exportToCSV(type, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-1">Generate financial reports and insights</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profit-loss')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'profit-loss'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Profit & Loss
            </button>
            <button
              onClick={() => setActiveTab('tax')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'tax'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-5 h-5 inline mr-2" />
              Tax Summary
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Client Report
            </button>
          </nav>
        </div>

        {/* Date Range Filter */}
        {activeTab !== 'clients' && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {activeTab === 'tax' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={
                  activeTab === 'profit-loss'
                    ? generateProfitLossReport
                    : activeTab === 'tax'
                    ? generateTaxReport
                    : generateClientReport
                }
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>

              <button
                onClick={handlePrint}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print
              </button>

              <button
                onClick={() =>
                  handleExport(activeTab === 'tax' ? 'expenses' : 'invoices')
                }
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={generateClientReport}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Report Content */}
        <div className="p-6">
          {activeTab === 'profit-loss' && profitLossReport && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Profit & Loss Statement</h2>
                <p className="text-gray-600">
                  {new Date(profitLossReport.period.startDate).toLocaleDateString()} -{' '}
                  {new Date(profitLossReport.period.endDate).toLocaleDateString()}
                </p>
              </div>

              {/* Revenue Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {profitLossReport.revenue.byClient.map((client, index) => (
                    <div key={index} className="flex justify-between py-2">
                      <span className="text-gray-700">{client.clientName}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(client.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-800">Total Revenue</span>
                    <span className="text-green-600">
                      {formatCurrency(profitLossReport.revenue.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Expenses</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {profitLossReport.expenses.byCategory.map((category, index) => (
                    <div key={index} className="flex justify-between py-2">
                      <span className="text-gray-700">{category.categoryName}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-800">Total Expenses</span>
                    <span className="text-orange-600">
                      {formatCurrency(profitLossReport.expenses.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Net Profit</h3>
                    <p className="text-sm text-gray-600">
                      Profit Margin: {profitLossReport.profitMargin}%
                    </p>
                  </div>
                  <div
                    className={`text-3xl font-bold ${
                      profitLossReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(profitLossReport.netProfit)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && taxReport && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Tax Summary Report</h2>
                <p className="text-gray-600">
                  {new Date(taxReport.period.startDate).toLocaleDateString()} -{' '}
                  {new Date(taxReport.period.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(taxReport.totalRevenue)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(taxReport.deductions.total)}
                  </p>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Tax-Deductible Expenses
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {taxReport.deductions.byCategory.map((category, index) => (
                    <div key={index} className="flex justify-between py-2">
                      <span className="text-gray-700">{category.categoryName}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Calculation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Taxable Income</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(taxReport.taxableIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax Rate</span>
                    <span className="font-semibold text-gray-900">{taxReport.taxRate}%</span>
                  </div>
                  <div className="border-t border-blue-300 pt-3 flex justify-between">
                    <span className="text-xl font-bold text-gray-800">
                      Estimated Tax Liability
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(taxReport.estimatedTaxLiability)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && clientReport.length > 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Client Report</h2>
                <p className="text-gray-600">Overview of all clients</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Invoices
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Unpaid
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Avg Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientReport.map((client) => (
                      <tr key={client.clientId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                          {formatCurrency(client.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {client.totalInvoices}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          {client.paidInvoices}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                          {client.unpaidInvoices}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                          {formatCurrency(client.outstandingBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(client.averageInvoiceAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!profitLossReport && activeTab === 'profit-loss' && !isLoading && (
            <p className="text-center text-gray-500 py-12">
              Select a date range and click "Generate Report"
            </p>
          )}

          {!taxReport && activeTab === 'tax' && !isLoading && (
            <p className="text-center text-gray-500 py-12">
              Select a date range and click "Generate Report"
            </p>
          )}

          {clientReport.length === 0 && activeTab === 'clients' && !isLoading && (
            <p className="text-center text-gray-500 py-12">
              Click "Generate Report" to view client statistics
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;