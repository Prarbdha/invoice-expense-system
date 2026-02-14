import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { ICreateExpenseRequest } from '../types/expense.types';
import { Prisma } from '@prisma/client';
import { deleteFile } from '../config/upload';
import path from 'path';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { categoryId, startDate, endDate, taxDeductible } = req.query;

    let where: any = { userId };

    // Filter by category
    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    // Filter by tax deductible
    if (taxDeductible !== undefined) {
      where.taxDeductible = taxDeductible === 'true';
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    sendSuccess(res, 200, 'Expenses fetched successfully', expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    sendError(res, 500, 'Error fetching expenses', error);
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: true,
      },
    });

    if (!expense) {
      return sendError(res, 404, 'Expense not found');
    }

    sendSuccess(res, 200, 'Expense fetched successfully', expense);
  } catch (error) {
    console.error('Get expense error:', error);
    sendError(res, 500, 'Error fetching expense', error);
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      categoryId,
      amount,
      date,
      description,
      vendor,
      taxDeductible = false,
    }: ICreateExpenseRequest = req.body;

    // Validation
    if (!categoryId || !amount || !date) {
      return sendError(res, 400, 'Category, amount, and date are required');
    }

    // Verify category exists and belongs to user
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // Get receipt URL if file was uploaded
    let receiptUrl = null;
    if (req.file) {
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        categoryId,
        amount: new Prisma.Decimal(amount),
        date: new Date(date),
        description: description || null,
        receiptUrl,
        vendor: vendor || null,
        taxDeductible,
      },
      include: {
        category: true,
      },
    });

    sendSuccess(res, 201, 'Expense created successfully', expense);
  } catch (error) {
    console.error('Create expense error:', error);
    sendError(res, 500, 'Error creating expense', error);
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { categoryId, amount, date, description, vendor, taxDeductible } = req.body;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingExpense) {
      return sendError(res, 404, 'Expense not found');
    }

    // Verify new category if provided
    if (categoryId && categoryId !== existingExpense.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: {
          id: categoryId,
          userId,
        },
      });

      if (!category) {
        return sendError(res, 404, 'Category not found');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (amount !== undefined) updateData.amount = new Prisma.Decimal(amount);
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description || null;
    if (vendor !== undefined) updateData.vendor = vendor || null;
    if (taxDeductible !== undefined) updateData.taxDeductible = taxDeductible;

    // Handle new receipt upload
    if (req.file) {
      // Delete old receipt if exists
      if (existingExpense.receiptUrl) {
        const oldFilePath = path.join(__dirname, '../../', existingExpense.receiptUrl);
        deleteFile(oldFilePath);
      }
      updateData.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    sendSuccess(res, 200, 'Expense updated successfully', expense);
  } catch (error) {
    console.error('Update expense error:', error);
    sendError(res, 500, 'Error updating expense', error);
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingExpense) {
      return sendError(res, 404, 'Expense not found');
    }

    // Delete receipt file if exists
    if (existingExpense.receiptUrl) {
      const filePath = path.join(__dirname, '../../', existingExpense.receiptUrl);
      deleteFile(filePath);
    }

    await prisma.expense.delete({
      where: { id },
    });

    sendSuccess(res, 200, 'Expense deleted successfully', null);
  } catch (error) {
    console.error('Delete expense error:', error);
    sendError(res, 500, 'Error deleting expense', error);
  }
};