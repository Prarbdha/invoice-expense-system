import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { analyticsService } from '../services/analyticsService';
import { ExpenseByCategory } from '../types/analytics.types';

const ExpensePieChart: React.FC = () => {
  const [data, setData] = useState<ExpenseByCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const chartData = await analyticsService.getExpensesByCategory();
      setData(chartData);
    } catch (error) {
      console.error('Failed to fetch expense data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Expenses by Category</h2>
        <p className="text-center text-gray-500 py-12">No expense data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Expenses by Category</h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percentage }) => `${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2">
        {data.map((category, index) => (
          <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded mr-3"
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-gray-700">{category.category}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gray-900">
                ${category.amount.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 ml-2">({category.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpensePieChart;