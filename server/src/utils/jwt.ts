import jwt from 'jsonwebtoken';
import { IJWTPayload } from '../types/user.types';

const JWT_SECRET = process.env.JWT_SECRET || 'qamfb0YcbZoz5umXL5PvqL8CREQ52FyRdvuMbHI41k7';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

export const generateToken = (payload: IJWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): IJWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IJWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};