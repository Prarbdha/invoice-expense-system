import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { ICreateCategoryRequest } from '../types/expense.types';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const categories = await prisma.expenseCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, 200, 'Categories fetched successfully', categories);
  } catch (error) {
    console.error('Get categories error:', error);
    sendError(res, 500, 'Error fetching categories', error);
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const category = await prisma.expenseCategory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    sendSuccess(res, 200, 'Category fetched successfully', category);
  } catch (error) {
    console.error('Get category error:', error);
    sendError(res, 500, 'Error fetching category', error);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, color = '#3B82F6' }: ICreateCategoryRequest = req.body;

    if (!name) {
      return sendError(res, 400, 'Category name is required');
    }

    // Check if category with same name already exists
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      return sendError(res, 400, 'Category with this name already exists');
    }

    const category = await prisma.expenseCategory.create({
      data: {
        userId,
        name,
        color,
      },
    });

    sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    console.error('Create category error:', error);
    sendError(res, 500, 'Error creating category', error);
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, color } = req.body;

    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCategory) {
      return sendError(res, 404, 'Category not found');
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existingCategory.name) {
      const duplicateName = await prisma.expenseCategory.findFirst({
        where: {
          userId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (duplicateName) {
        return sendError(res, 400, 'Category with this name already exists');
      }
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        color: color || existingCategory.color,
      },
    });

    sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    console.error('Update category error:', error);
    sendError(res, 500, 'Error updating category', error);
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCategory) {
      return sendError(res, 404, 'Category not found');
    }

    // Check if category has expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      return sendError(
        res,
        400,
        'Cannot delete category with existing expenses. Please delete expenses first or reassign them to another category.'
      );
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });

    sendSuccess(res, 200, 'Category deleted successfully', null);
  } catch (error) {
    console.error('Delete category error:', error);
    sendError(res, 500, 'Error deleting category', error);
  }
};

// Create default categories for new users
export const createDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    { name: 'Office Supplies', color: '#3B82F6' },
    { name: 'Travel', color: '#10B981' },
    { name: 'Meals & Entertainment', color: '#F59E0B' },
    { name: 'Software & Subscriptions', color: '#8B5CF6' },
    { name: 'Marketing', color: '#EF4444' },
    { name: 'Utilities', color: '#6366F1' },
    { name: 'Professional Services', color: '#EC4899' },
    { name: 'Other', color: '#6B7280' },
  ];

  await prisma.expenseCategory.createMany({
    data: defaultCategories.map((cat) => ({
      ...cat,
      userId,
    })),
    skipDuplicates: true,
  });
};