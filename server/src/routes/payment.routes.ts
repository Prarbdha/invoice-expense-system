import express from 'express';
import {
  getPaymentsByInvoice,
  recordPayment,
  updatePayment,
  deletePayment,
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/invoice/:invoiceId', getPaymentsByInvoice);
router.post('/invoice/:invoiceId', recordPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;