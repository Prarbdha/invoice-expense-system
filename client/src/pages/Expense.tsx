import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, FileText, DollarSign } from 'lucide-react';
import axios from 'axios';

import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import type { Expense, ExpenseCategory } from '../types/expense.types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ExpenseQueryParams = {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
};

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch expenses whenever filters change
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        setError('');

        const params: ExpenseQueryParams = {};

        if (categoryFilter) params.categoryId = categoryFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const data = await expenseService.getAll(params);
        setExpenses(data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message || 'Failed to fetch expenses'
          );
        } else {
          setError('Unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [categoryFilter, startDate, endDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.delete(id);

      // Refresh expenses after deletion
      const updatedExpenses = expenses.filter(
        (expense) => expense.id !== id
      );
      setExpenses(updatedExpenses);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(
          err.response?.data?.message || 'Failed to delete expense'
        );
      } else {
        alert('Unexpected error occurred');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>

        <Link
          to="/expenses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Expense
        </Link>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <DollarSign className="w-16 h-16 text-blue-300 opacity-50" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No expenses found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Vendor</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Receipt</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4">
                    {formatDate(expense.date)}
                  </td>

                  <td className="px-6 py-4">
                    {expense.category?.name || 'Uncategorized'}
                  </td>

                  <td className="px-6 py-4">
                    {expense.description || '-'}
                  </td>

                  <td className="px-6 py-4">
                    {expense.vendor || '-'}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {formatCurrency(Number(expense.amount))}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {expense.receiptUrl ? (
                      <a
                        href={`${API_BASE_URL}${expense.receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FileText className="w-5 h-5 mx-auto" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/expenses/edit/${expense.id}`}
                      className="text-blue-600 mr-4"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Expenses;
