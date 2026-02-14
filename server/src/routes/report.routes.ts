import express from 'express';
import {
  getProfitLossReport,
  getTaxSummaryReport,
  getClientReport,
  exportToCSV,
} from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/profit-loss', getProfitLossReport);
router.get('/tax-summary', getTaxSummaryReport);
router.get('/clients', getClientReport);
router.get('/export', exportToCSV);

export default router;