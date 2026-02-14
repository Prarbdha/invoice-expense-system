import express from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../config/upload';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', upload.single('receipt'), createExpense);
router.put('/:id', upload.single('receipt'), updateExpense);
router.delete('/:id', deleteExpense);

export default router;