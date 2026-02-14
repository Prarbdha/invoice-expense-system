import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { hashPassword, comparePassword } from '../utils/password';

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { companyName, email, phone, address, taxId } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return sendError(res, 400, 'Email already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        companyName: companyName !== undefined ? companyName : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        taxId: taxId !== undefined ? taxId : undefined,
      },
    });

    const { password, ...userWithoutPassword } = user;

    sendSuccess(res, 200, 'Profile updated successfully', userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 500, 'Error updating profile', error);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters');
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    sendSuccess(res, 200, 'Password changed successfully', null);
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 500, 'Error changing password', error);
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    if (!req.file) {
      return sendError(res, 400, 'No file uploaded');
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { companyLogo: logoUrl },
    });

    const { password, ...userWithoutPassword } = user;

    sendSuccess(res, 200, 'Logo uploaded successfully', userWithoutPassword);
  } catch (error) {
    console.error('Upload logo error:', error);
    sendError(res, 500, 'Error uploading logo', error);
  }
};