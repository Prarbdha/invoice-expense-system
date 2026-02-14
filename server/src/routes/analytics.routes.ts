import express from 'express';
import {
  getDashboardOverview,
  getRevenueByMonth,
  getExpensesByCategory,
  getTopClients,
  getRecentActivity,
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', getDashboardOverview);
router.get('/revenue-by-month', getRevenueByMonth);
router.get('/expenses-by-category', getExpensesByCategory);
router.get('/top-clients', getTopClients);
router.get('/recent-activity', getRecentActivity);

export default router;