import { Request } from 'express';

// Define a type for the user object attached to the request (only selected fields)
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  emailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Express Request type that includes the authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
} 