import { z } from 'zod';

// Password validation schema with security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)');

// Email validation schema
const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .max(254, 'Email address is too long')
  .transform(email => email.toLowerCase().trim());

// Name validation schema
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
  .transform(name => name.trim());

// Token validation schema
const tokenSchema = z
  .string()
  .min(1, 'Token is required')
  .max(2048, 'Token is too long');

// Registration schema
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
});

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
    captcha: z.string().optional() // For rate limiting protection
  })
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: tokenSchema
  }).or(z.object({
    refresh_token: tokenSchema
  }))
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: emailSchema,
    captcha: z.string().optional()
  })
});

// Password reset confirmation schema
export const passwordResetConfirmSchema = z.object({
  body: z.object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
});

// Change password schema (for authenticated users)
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'New password confirmation is required')
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"]
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"]
  })
});

// Email verification schema
export const emailVerificationSchema = z.object({
  params: z.object({
    token: tokenSchema
  })
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    subscriptionTier: z.enum(['free', 'pro', 'enterprise']).optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  })
});

// Session management schema
export const sessionManagementSchema = z.object({
  body: z.object({
    action: z.enum(['invalidate_all', 'invalidate_session']),
    sessionId: z.string().uuid().optional()
  }).refine((data) => {
    if (data.action === 'invalidate_session' && !data.sessionId) {
      return false;
    }
    return true;
  }, {
    message: "Session ID is required when invalidating a specific session",
    path: ["sessionId"]
  })
});

// Two-factor authentication setup schema
export const twoFactorSetupSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required for 2FA setup'),
    method: z.enum(['totp', 'sms', 'email']).default('totp')
  })
});

// Two-factor authentication verification schema
export const twoFactorVerifySchema = z.object({
  body: z.object({
    token: z.string().length(6, 'Two-factor code must be 6 digits').regex(/^\d{6}$/, 'Two-factor code must contain only numbers'),
    method: z.enum(['totp', 'sms', 'email']).default('totp')
  })
});

// Account deletion schema
export const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required to delete account'),
    confirmation: z.literal('DELETE', {
      errorMap: () => ({ message: 'You must type "DELETE" to confirm account deletion' })
    })
  })
});

// Rate limit bypass schema (for testing or admin actions)
export const rateLimitBypassSchema = z.object({
  headers: z.object({
    'x-bypass-rate-limit': z.string().optional()
  })
});

// Login attempt tracking schema
export const loginAttemptSchema = z.object({
  ip: z.string(),
  userAgent: z.string().optional(),
  email: emailSchema,
  success: z.boolean(),
  timestamp: z.date().default(() => new Date())
});

// Security event schema for audit logging
export const securityEventSchema = z.object({
  userId: z.string().uuid().optional(),
  email: emailSchema.optional(),
  event: z.enum([
    'login_success',
    'login_failure',
    'password_reset_request',
    'password_reset_success',
    'password_change',
    'email_verification',
    'account_locked',
    'account_unlocked',
    'session_created',
    'session_destroyed',
    'token_refresh',
    'suspicious_activity'
  ]),
  ip: z.string(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date())
});

// Export types for TypeScript
export type RegisterData = z.infer<typeof registerSchema>['body'];
export type LoginData = z.infer<typeof loginSchema>['body'];
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>['body'];
export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>['body'];
export type ChangePasswordData = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileData = z.infer<typeof updateProfileSchema>['body'];
export type SecurityEventData = z.infer<typeof securityEventSchema>;
export type LoginAttemptData = z.infer<typeof loginAttemptSchema>; 