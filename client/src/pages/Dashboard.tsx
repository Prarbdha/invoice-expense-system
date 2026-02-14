import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  FileEdit,
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import type { DashboardOverview, RecentActivity } from '../types/analytics.types';

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [overviewData, activityData] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getRecentActivity(5),
      ]);
      setOverview(overviewData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'expense':
        return <Receipt className="w-5 h-5 text-orange-600" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      default:
        return <FileEdit className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-30 rounded-lg p-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(overview.totalRevenue)}</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-30 rounded-lg p-3">
              <Receipt className="w-6 h-6" />
            </div>
            <TrendingDown className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-orange-100 text-sm font-medium">Total Expenses</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(overview.totalExpenses)}</p>
        </div>

        {/* Profit */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-30 rounded-lg p-3">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-green-100 text-sm font-medium">Net Profit</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(overview.profit)}</p>
        </div>

        {/* Outstanding */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-30 rounded-lg p-3">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-purple-100 text-sm font-medium">Outstanding</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(overview.outstandingAmount)}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Invoice Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Overview</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Total Invoices</span>
              </div>
              <span className="font-semibold text-gray-900">{overview.invoiceStats.total}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Sent</span>
              </div>
              <span className="font-semibold text-blue-600">{overview.invoiceStats.sent}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">Paid</span>
              </div>
              <span className="font-semibold text-green-600">{overview.invoiceStats.paid}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-gray-700">Overdue</span>
              </div>
              <span className="font-semibold text-red-600">{overview.invoiceStats.overdue}</span>
            </div>
          </div>
        </div>

        {/* Expense Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Receipt className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Total Expenses</span>
              </div>
              <span className="font-semibold text-gray-900">{overview.expenseStats.total}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-orange-600 mr-3" />
                <span className="text-gray-700">This Month</span>
              </div>
              <span className="font-semibold text-orange-600">
                {formatCurrency(overview.expenseStats.thisMonth)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Last Month</span>
              </div>
              <span className="font-semibold text-blue-600">
                {formatCurrency(overview.expenseStats.lastMonth)}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                {overview.expenseStats.thisMonth > overview.expenseStats.lastMonth ? (
                  <span className="text-red-600">
                    ↑ {((overview.expenseStats.thisMonth / overview.expenseStats.lastMonth - 1) * 100).toFixed(1)}% vs last month
                  </span>
                ) : (
                  <span className="text-green-600">
                    ↓ {((1 - overview.expenseStats.thisMonth / overview.expenseStats.lastMonth) * 100).toFixed(1)}% vs last month
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-full p-2">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        activity.type === 'expense' ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {activity.type === 'expense' ? '-' : '+'}
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/invoices"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all activity →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;