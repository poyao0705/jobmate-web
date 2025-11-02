/**
 * Utility functions for handling Zod validation errors
 */

import { ZodError } from 'zod';

/**
 * Format a Zod error into a user-friendly message
 */
export function formatZodError(error: ZodError): string {
  if (error.issues.length === 0) {
    return 'Validation failed';
  }

  const messages = error.issues.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return messages.join(', ');
}

/**
 * Get a user-friendly error message from a Zod error
 * Returns the first error message if available
 */
export function getZodErrorMessage(error: ZodError): string {
  if (error.issues.length === 0) {
    return 'Validation failed';
  }

  const firstError = error.issues[0];
  const path = firstError.path.join('.');
  return path ? `${path}: ${firstError.message}` : firstError.message;
}

/**
 * Check if an error is a Zod validation error
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Extract field-specific errors from a Zod error
 */
export function getFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((err) => {
    const field = err.path.join('.');
    if (field) {
      fieldErrors[field] = err.message;
    }
  });

  return fieldErrors;
}
