import { Request } from 'express';

// User interface for authentication
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  subscriptionTier: string;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}

// Express Request type that includes the authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
} 