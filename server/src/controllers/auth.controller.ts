import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { IRegisterRequest, ILoginRequest, IUserResponse } from '../types/user.types';
import { createDefaultCategories } from './category.controller';

// Helper function to exclude password from user object
const excludePassword = (user: any): IUserResponse => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, companyName }: IRegisterRequest = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError(res, 400, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        companyName: companyName || null,
      },
    });

    // Create default expense categories
    await createDefaultCategories(user.id);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    sendSuccess(res, 201, 'User registered successfully', {
      token,
      user: excludePassword(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 500, 'Error registering user', error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: ILoginRequest = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Send response
    sendSuccess(res, 200, 'Login successful', {
      token,
      user: excludePassword(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Error logging in', error);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // userId is added by auth middleware
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendSuccess(res, 200, 'Profile fetched successfully', excludePassword(user));
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 500, 'Error fetching profile', error);
  }
};