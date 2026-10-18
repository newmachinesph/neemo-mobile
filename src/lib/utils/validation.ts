import { z } from 'zod';

/**
 * Reusable email schema.
 */
export const emailSchema = z.email('Please enter a valid email address');

/**
 * Password must be at least 8 characters and contain:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number');

/**
 * Name: 1-100 characters, trimmed.
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or fewer')
  .transform((val) => val.trim());

/**
 * Monetary amount: positive number with at most 2 decimal places.
 */
export const amountSchema = z
  .number()
  .positive('Amount must be greater than zero')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

// ────────────────────────────────────────────────────────────────────────────
// Compound schemas (convenience)
// ────────────────────────────────────────────────────────────────────────────

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
